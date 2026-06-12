import { readFile } from 'node:fs/promises';

import { type AssistantResponded, parseAssistantResponded } from './parse-assistant-responded.js';
import { type FileModified, parseFileModified } from './parse-file-modified.js';
import { type HookExecuted, parseHookExecuted } from './parse-hook-executed.js';
import { type PromptSubmitted, parsePromptSubmitted } from './parse-prompt-submitted.js';
import { parseSessionEnded, type SessionEnded } from './parse-session-ended.js';
import { parseSubagentProgressed, type SubagentProgressed } from './parse-subagent-progressed.js';
import { parseThoughtRecorded, type ThoughtRecorded } from './parse-thought-recorded.js';
import { parseToolInvocationFailed, type ToolInvocationFailed } from './parse-tool-invocation-failed.js';
import { parseToolInvocationSucceeded, type ToolInvocationSucceeded } from './parse-tool-invocation-succeeded.js';
import { parseToolInvoked, type ToolInvoked } from './parse-tool-invoked.js';
import { parseSessionStarted, type SessionStarted } from './translator.js';

export type SessionEvent =
  | SessionStarted
  | PromptSubmitted
  | AssistantResponded
  | ThoughtRecorded
  | ToolInvoked
  | ToolInvocationSucceeded
  | ToolInvocationFailed
  | HookExecuted
  | SubagentProgressed
  | FileModified
  | SessionEnded;

export async function translateSession(jsonlPath: string): Promise<SessionEvent[]> {
  const content = await readFile(jsonlPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.length > 0);
  const events: SessionEvent[] = [];
  for (const line of lines) {
    events.push(...parseSessionStarted(line));
    events.push(...parsePromptSubmitted(line));
    events.push(...parseAssistantResponded(line));
    events.push(...parseThoughtRecorded(line));
    events.push(...parseToolInvoked(line));
    events.push(...parseToolInvocationSucceeded(line));
    events.push(...parseToolInvocationFailed(line));
    events.push(...parseHookExecuted(line));
    events.push(...parseSubagentProgressed(line));
    events.push(...parseFileModified(line));
    events.push(...parseSessionEnded(line));
  }
  return events;
}
