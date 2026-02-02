import { readFileSync } from 'node:fs';

import type { ClueCollectorResult } from '../clue-collector.js';
import { createHookState } from '../hook-state.js';

export interface StopHookInput {
  session_id?: string;
  transcript_path?: string;
  stop_hook_active?: boolean;
  cwd?: string;
  permission_mode?: string;
}

export interface StopHookResult {
  decision: 'allow' | 'block';
  reason: string;
}

export interface IncompleteBurstsResult {
  count: number;
  path: string;
  todoSection: string;
}

export function getIncompleteBursts(planPath: string): IncompleteBurstsResult {
  try {
    const content = readFileSync(planPath, 'utf8');

    const allUnchecked = content.match(/- \[ \]/g);
    const count = allUnchecked?.length || 0;

    if (count === 0) {
      return { count: 0, path: planPath, todoSection: '' };
    }

    const todoMatch = content.match(/#{2,3}\s*TODO[\s\S]*?(?=#{2,3}\s*DONE|#{2,3}\s*[A-Z]|$)/i);
    const todoSection = todoMatch ? todoMatch[0].slice(0, 500) : `${count} unchecked items found`;

    return { count, path: planPath, todoSection };
  } catch {
    return { count: 0, path: planPath, todoSection: '' };
  }
}

export function buildPrompt(clues: ClueCollectorResult, ketchupInfo: string): string {
  const cluesList = clues.clues.map((c) => `[${c.timestamp}] [${c.type}] ${c.text}`).join('\n\n');

  const chatsList = clues.lastChats
    .map((c) => `[${c.timestamp}]\nUser: ${c.user}\nAssistant: ${c.assistant}`)
    .join('\n\n---\n\n');

  return `You are deciding whether an AI coding assistant should CONTINUE working or STOP.

## Clues from Session Log (ordered by time):
${cluesList || '(no clues found)'}

## Last 5 Chat Exchanges:
${chatsList || '(no chats found)'}

## Ketchup Plans Status:
${ketchupInfo || '(no incomplete bursts found)'}

## Decision Criteria:
CONTINUE if:
- The assistant asked "would you like to continue?" or similar
- There are remaining bursts in ketchup-plan.md
- The assistant mentioned there's more work to do
- The last chat shows unfinished work

STOP if:
- All work appears complete
- The user said to stop or the task is done
- No signals of remaining work

Respond JSON only: {"decision":"CONTINUE","reason":"..."} or {"decision":"STOP","reason":"..."}`;
}

export function handleStop(ketchupDir: string, input: StopHookInput): StopHookResult {
  const stateManager = createHookState(ketchupDir);
  const state = stateManager.read();
  const { mode, skipModes } = state.autoContinue;

  if (mode === 'off') {
    return { decision: 'allow', reason: 'auto-continue disabled' };
  }

  if (input.stop_hook_active) {
    return { decision: 'allow', reason: 'stop hook already active' };
  }

  const modesToSkip = skipModes ?? ['plan'];
  if (input.permission_mode && modesToSkip.includes(input.permission_mode)) {
    return { decision: 'allow', reason: `skipping mode: ${input.permission_mode}` };
  }

  return { decision: 'allow', reason: 'no work remaining' };
}
