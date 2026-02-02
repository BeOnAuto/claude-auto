#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handleSessionStart } from '../src/hooks/session-start.js';
import { resolvePaths } from '../src/path-resolver.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const startTime = Date.now();

(async () => {
  const { ketchupDir } = await resolvePaths(claudeDir);
  try {
    const { diagnostics, ...result } = await handleSessionStart(claudeDir, input.session_id);
    writeHookLog(ketchupDir, {
      hookName: 'session-start',
      timestamp: new Date().toISOString(),
      input,
      resolvedPaths: diagnostics.resolvedPaths,
      reminderFiles: diagnostics.reminderFiles,
      matchedReminders: diagnostics.matchedReminders,
      output: result,
      durationMs: Date.now() - startTime,
    });
    console.log(JSON.stringify(result));
  } catch (err) {
    writeHookLog(ketchupDir, {
      hookName: 'session-start',
      timestamp: new Date().toISOString(),
      input,
      output: null,
      error: String(err),
      durationMs: Date.now() - startTime,
    });
    console.error('session-start hook failed:', err);
    process.exit(1);
  }
})();
