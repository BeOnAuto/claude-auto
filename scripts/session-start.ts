#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { activityLog } from '../src/activity-logger.js';
import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handleSessionStart } from '../src/hooks/session-start.js';
import { resolvePaths } from '../src/path-resolver.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const startTime = Date.now();

(async () => {
  const { autoDir } = await resolvePaths(claudeDir);
  try {
    const { diagnostics, ...result } = await handleSessionStart(claudeDir, input.session_id, input.prompt);
    writeHookLog(autoDir, {
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
    process.exit(0);
  } catch (err) {
    activityLog(autoDir, input.session_id, 'session-start', `error: ${String(err)}`);
    writeHookLog(autoDir, {
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
