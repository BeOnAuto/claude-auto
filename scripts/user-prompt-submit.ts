#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handleUserPromptSubmit } from '../src/hooks/user-prompt-submit.js';
import { resolvePaths } from '../src/path-resolver.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const startTime = Date.now();

(async () => {
  const { autoDir } = await resolvePaths(claudeDir);
  try {
    const { diagnostics, ...result } = await handleUserPromptSubmit(claudeDir, input.session_id);
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
