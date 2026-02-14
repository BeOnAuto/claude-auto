#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { writeHookLog } from '../src/hook-logger.js';
import { handleStop, type StopHookInput } from '../src/hooks/auto-continue.js';
import { resolvePaths } from '../src/path-resolver.js';

const claudeDir = path.resolve(process.cwd(), '.claude');
const stdin = fs.readFileSync(0, 'utf8').trim();

if (!stdin) {
  process.exit(0);
}

const input: StopHookInput = JSON.parse(stdin);
const startTime = Date.now();

(async () => {
  const { autoDir } = await resolvePaths(claudeDir);
  const result = handleStop(autoDir, input);

  const output = result.decision === 'block' ? { decision: 'block', reason: result.reason } : null;

  writeHookLog(autoDir, {
    hookName: 'auto-continue',
    timestamp: new Date().toISOString(),
    input,
    output: output ?? { decision: result.decision, reason: result.reason },
    durationMs: Date.now() - startTime,
  });

  if (output) {
    console.log(JSON.stringify(output));
  }

  process.exit(0);
})();
