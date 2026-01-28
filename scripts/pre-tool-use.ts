#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handlePreToolUse } from '../src/hooks/pre-tool-use.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const startTime = Date.now();

handlePreToolUse(claudeDir, input.session_id, input.tool_input || {})
  .then((result) => {
    writeHookLog(claudeDir, {
      hookName: 'pre-tool-use',
      timestamp: new Date().toISOString(),
      input,
      output: result,
      durationMs: Date.now() - startTime,
    });
    console.log(JSON.stringify(result));
  })
  .catch((err) => {
    writeHookLog(claudeDir, {
      hookName: 'pre-tool-use',
      timestamp: new Date().toISOString(),
      input,
      output: null,
      error: String(err),
      durationMs: Date.now() - startTime,
    });
    console.error('pre-tool-use hook failed:', err);
    process.exit(1);
  });
