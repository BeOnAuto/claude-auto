#!/usr/bin/env tsx

// ClueCollector: Extracts ordered clues from Claude Code session logs
// Can be run standalone for tuning: npx tsx clue-collector.ts <transcript_path>

import { readFileSync } from 'fs';

// Aggressive patterns for detecting "continue" signals
export const CONTINUE_PATTERNS = [
  // Explicit continuation asks
  /would you like (?:me )?to continue/i,
  /shall I (?:continue|proceed)/i,
  /ready to proceed/i,
  /let me know (?:if|when) you(?:'d| would) like/i,

  // Work remaining signals
  /remaining bursts?/i,
  /continue with the (?:remaining|next)/i,
  /next (?:burst|step|phase)/i,
  /more (?:bursts?|work|tasks?) (?:to|remaining)/i,
  /still (?:have|need to|outstanding)/i,

  // Progress patterns
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
  ketchupPlanPaths: string[];  // Actual paths from Read/Edit/Write tool calls or text mentions
  workingDirs: string[];       // Directories Claude touched (from file paths in tool calls)
  summary: string;
}

const MAX_CLUES_PER_TYPE = 10;
const MAX_CHATS = 5;
const MAX_TEXT_LENGTH = 200;

function truncate(text: string, maxLen: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function extractTextFromEntry(entry: any): string {
  if (!entry.message?.content) return '';
  const textBlocks = entry.message.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text);
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
    const content = readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const timestamp = entry.timestamp || '';
        const type = entry.type;

        // Track session cwd
        if (entry.cwd) {
          sessionCwd = entry.cwd;
        }

        // Extract ketchup plan paths AND working directories from tool calls
        if (entry.message?.content) {
          for (const block of entry.message.content) {
            if (block.type === 'tool_use') {
              const filePath = block.input?.file_path || block.input?.notebook_path;
              if (filePath) {
                // Track ketchup plan paths
                if (/ketchup-plan\.md$/i.test(filePath)) {
                  ketchupPlanPathsSet.add(filePath);
                }
                // Track working directories (extract dir from file path)
                const dirMatch = filePath.match(/^(.+)\/[^/]+$/);
                if (dirMatch) {
                  workingDirsSet.add(dirMatch[1]);
                }
              }
              // Also check Bash commands for cd patterns
              if (block.input?.command) {
                const cdMatch = block.input.command.match(/cd\s+(?:"([^"]+)"|'([^']+)'|(\/[^\s&;|]+))/);
                if (cdMatch) {
                  const dir = cdMatch[1] || cdMatch[2] || cdMatch[3];
                  if (dir?.startsWith('/')) {
                    workingDirsSet.add(dir);
                  }
                }
              }
            }
            // Also search TEXT content for ketchup plan paths mentioned in prose
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

        // Extract text content
        const text = extractTextFromEntry(entry);

        // Also search text for ketchup plan paths (catches paths in any text content)
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

        // Track chat exchanges
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

        // Only look at assistant messages for clues
        if (type !== 'assistant') continue;

        // Check CONTINUE_PATTERNS
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
            break; // One pattern match per message
          }
        }

        // Check for "ketchup" mentions
        if (/ketchup/i.test(text)) {
          ketchupClues.push({
            type: 'ketchup',
            timestamp,
            source,
            text: truncate(text),
          });
        }

        // Check for "plan" mentions (loose matching)
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
    // Return empty result on file read error
    return {
      clues: [],
      lastChats: [],
      sessionCwd,
      ketchupPlanPaths: [],
      workingDirs: [],
      summary: `Error reading transcript: ${err}`,
    };
  }

  // Keep last N of each type
  const limitedPatterns = patternClues.slice(-MAX_CLUES_PER_TYPE);
  const limitedKetchup = ketchupClues.slice(-MAX_CLUES_PER_TYPE);
  const limitedPlans = planClues.slice(-MAX_CLUES_PER_TYPE);

  // Merge and sort by timestamp
  const allClues = [...limitedPatterns, ...limitedKetchup, ...limitedPlans]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Get last N chat exchanges
  const lastChats: ChatExchange[] = chatBuffer
    .slice(-MAX_CHATS)
    .map(c => ({
      timestamp: c.timestamp,
      user: c.user || '',
      assistant: c.assistant || '',
    }));

  // Convert sets to arrays
  const ketchupPlanPaths = Array.from(ketchupPlanPathsSet);
  const workingDirs = Array.from(workingDirsSet);

  // Build summary
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

// CLI mode: run directly to test
if (import.meta.url === `file://${process.argv[1]}`) {
  const transcriptPath = process.argv[2];
  if (!transcriptPath) {
    console.error('Usage: npx tsx clue-collector.ts <transcript_path>');
    process.exit(1);
  }

  const result = collectClues(transcriptPath);
  console.log(JSON.stringify(result, null, 2));
}
