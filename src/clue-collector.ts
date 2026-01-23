import * as fs from 'node:fs';

export const CONTINUE_PATTERNS = [
  /would you like (?:me )?to continue/i,
  /shall I (?:continue|proceed)/i,
  /ready to proceed/i,
  /let me know (?:if|when) you(?:'d| would) like/i,
  /remaining bursts?/i,
  /continue with the (?:remaining|next)/i,
  /next (?:burst|step|phase)/i,
  /more (?:bursts?|work|tasks?) (?:to|remaining)/i,
  /still (?:have|need to|outstanding)/i,
  /building up nicely/i,
  /is building/i,
  /coming along/i,
];

export interface Clue {
  type: 'pattern' | 'ketchup' | 'plan';
  timestamp: string;
  source: 'user' | 'assistant';
  text: string;
  matchedPattern?: string;
}

export interface ChatExchange {
  timestamp: string;
  user: string;
  assistant: string;
}

export interface ClueCollectorResult {
  clues: Clue[];
  lastChats: ChatExchange[];
  sessionCwd: string;
  ketchupPlanPaths: string[];
  workingDirs: string[];
  summary: string;
}

const MAX_CLUES_PER_TYPE = 10;
const MAX_CHATS = 5;
const MAX_TEXT_LENGTH = 200;

function truncate(text: string, maxLen: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
}

interface TranscriptEntry {
  type?: string;
  timestamp?: string;
  cwd?: string;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      input?: {
        file_path?: string;
        notebook_path?: string;
        command?: string;
      };
    }>;
  };
}

function extractTextFromEntry(entry: TranscriptEntry): string {
  if (!entry.message?.content) return '';
  const textBlocks = entry.message.content.filter((b) => b.type === 'text').map((b) => b.text ?? '');
  return textBlocks.join('\n');
}

export function collectClues(transcriptPath: string): ClueCollectorResult {
  const patternClues: Clue[] = [];
  const ketchupClues: Clue[] = [];
  const planClues: Clue[] = [];
  const chatBuffer: { timestamp: string; user?: string; assistant?: string }[] = [];
  const ketchupPlanPathsSet = new Set<string>();
  const workingDirsSet = new Set<string>();
  let sessionCwd = process.cwd();
  let lastUserMsg = '';
  let lastUserTimestamp = '';

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as TranscriptEntry;
        const timestamp = entry.timestamp ?? '';
        const type = entry.type;

        if (entry.cwd) {
          sessionCwd = entry.cwd;
        }

        if (entry.message?.content) {
          for (const block of entry.message.content) {
            if (block.type === 'tool_use') {
              const filePath = block.input?.file_path ?? block.input?.notebook_path;
              if (filePath) {
                if (/ketchup-plan\.md$/i.test(filePath)) {
                  ketchupPlanPathsSet.add(filePath);
                }
                const dirMatch = filePath.match(/^(.+)\/[^/]+$/);
                if (dirMatch) {
                  workingDirsSet.add(dirMatch[1]);
                }
              }
              if (block.input?.command) {
                const cdMatch = block.input.command.match(/cd\s+(?:"([^"]+)"|'([^']+)'|(\/[^\s&;|]+))/);
                if (cdMatch) {
                  const dir = cdMatch[1] ?? cdMatch[2] ?? cdMatch[3];
                  if (dir?.startsWith('/')) {
                    workingDirsSet.add(dir);
                  }
                }
              }
            }
            if (block.type === 'text' && block.text) {
              const pathMatches = block.text.match(/\/[^\s"'`\n]+ketchup-plan\.md/gi);
              if (pathMatches) {
                for (const p of pathMatches) {
                  ketchupPlanPathsSet.add(p);
                }
              }
            }
          }
        }

        const text = extractTextFromEntry(entry);

        if (text) {
          const textPathMatches = text.match(/(?:\/[\w.-]+)+\/ketchup-plan\.md/gi);
          if (textPathMatches) {
            for (const p of textPathMatches) {
              ketchupPlanPathsSet.add(p);
            }
          }
        }

        if (!text) continue;

        const source: 'user' | 'assistant' = type === 'user' ? 'user' : 'assistant';

        if (type === 'user') {
          lastUserMsg = truncate(text, 500);
          lastUserTimestamp = timestamp;
        } else if (type === 'assistant' && lastUserMsg) {
          chatBuffer.push({
            timestamp: lastUserTimestamp,
            user: lastUserMsg,
            assistant: truncate(text, 500),
          });
          lastUserMsg = '';
        }

        if (type !== 'assistant') continue;

        for (const pattern of CONTINUE_PATTERNS) {
          const match = text.match(pattern);
          if (match) {
            patternClues.push({
              type: 'pattern',
              timestamp,
              source,
              text: truncate(text),
              matchedPattern: match[0],
            });
            break;
          }
        }

        if (/ketchup/i.test(text)) {
          ketchupClues.push({
            type: 'ketchup',
            timestamp,
            source,
            text: truncate(text),
          });
        }

        if (/\bplan\b/i.test(text)) {
          planClues.push({
            type: 'plan',
            timestamp,
            source,
            text: truncate(text),
          });
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    return {
      clues: [],
      lastChats: [],
      sessionCwd,
      ketchupPlanPaths: [],
      workingDirs: [],
      summary: `Error reading transcript: ${err}`,
    };
  }

  const limitedPatterns = patternClues.slice(-MAX_CLUES_PER_TYPE);
  const limitedKetchup = ketchupClues.slice(-MAX_CLUES_PER_TYPE);
  const limitedPlans = planClues.slice(-MAX_CLUES_PER_TYPE);

  const allClues = [...limitedPatterns, ...limitedKetchup, ...limitedPlans].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );

  const lastChats: ChatExchange[] = chatBuffer.slice(-MAX_CHATS).map((c) => ({
    timestamp: c.timestamp,
    user: c.user as string,
    assistant: c.assistant as string,
  }));

  const ketchupPlanPaths = Array.from(ketchupPlanPathsSet);
  const workingDirs = Array.from(workingDirsSet);

  const summary = [
    `Pattern clues: ${limitedPatterns.length}`,
    `Ketchup clues: ${limitedKetchup.length}`,
    `Plan clues: ${limitedPlans.length}`,
    `Last chats: ${lastChats.length}`,
    `Ketchup plans: ${ketchupPlanPaths.length}`,
    `Working dirs: ${workingDirs.length}`,
    `Session cwd: ${sessionCwd}`,
  ].join(', ');

  return {
    clues: allClues,
    lastChats,
    sessionCwd,
    ketchupPlanPaths,
    workingDirs,
    summary,
  };
}
