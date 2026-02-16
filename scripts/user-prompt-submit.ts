#!/usr/bin/env npx tsx
import * as fs from 'node:fs';

import { activityLog } from '../src/activity-logger.js';
import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handleUserPromptSubmit } from '../src/hooks/user-prompt-submit.js';
import { resolveClaudeDirFromScript, resolvePaths } from '../src/path-resolver.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = resolveClaudeDirFromScript(__dirname);
const startTime = Date.now();

(async () => {
  const { autoDir } = await resolvePaths(claudeDir);
  try {
    const { diagnostics, ...result } = await handleUserPromptSubmit(claudeDir, input.session_id, input.prompt);
    writeHookLog(autoDir, {
      hookName: 'user-prompt-submit',
      timestamp: new Date().toISOString(),
      input: { ...input, prompt: input.prompt ? `[${input.prompt.length} chars]` : undefined },
      resolvedPaths: diagnostics.resolvedPaths,
      reminderFiles: diagnostics.reminderFiles,
      matchedReminders: diagnostics.matchedReminders,
      output: { contextLength: result.hookSpecificOutput.additionalContext.length },
      durationMs: Date.now() - startTime,
    });
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    activityLog(autoDir, input.session_id, 'user-prompt-submit', `error: ${String(err)}`);
    writeHookLog(autoDir, {
      hookName: 'user-prompt-submit',
      timestamp: new Date().toISOString(),
      input: { ...input, prompt: input.prompt ? `[${input.prompt.length} chars]` : undefined },
      output: null,
      error: String(err),
      durationMs: Date.now() - startTime,
    });
    console.error('user-prompt-submit hook failed:', err);
    process.exit(1);
  }
})();
