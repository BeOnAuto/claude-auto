#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { isCommitCommand } from '../src/commit-validator.js';
import { parseHookInput } from '../src/hook-input.js';
import { writeHookLog } from '../src/hook-logger.js';
import { handlePreToolUse } from '../src/hooks/pre-tool-use.js';
import { resolvePaths } from '../src/path-resolver.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const startTime = Date.now();

(async () => {
  const { autoDir } = await resolvePaths(claudeDir);
  try {
    const toolInput = input.tool_input || {};
    const command = toolInput.command as string | undefined;
    const result = await handlePreToolUse(claudeDir, input.session_id, toolInput);
    if (command && isCommitCommand(command)) {
      writeHookLog(autoDir, {
        hookName: 'pre-tool-use',
        timestamp: new Date().toISOString(),
        input,
        output: result,
        durationMs: Date.now() - startTime,
      });
    }
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    writeHookLog(autoDir, {
      hookName: 'pre-tool-use',
      timestamp: new Date().toISOString(),
      input,
      output: null,
      error: String(err),
      durationMs: Date.now() - startTime,
    });
    console.error('pre-tool-use hook failed:', err);
    process.exit(1);
  }
})();
