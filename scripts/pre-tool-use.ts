#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { handlePreToolUse } from '../src/hooks/pre-tool-use.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');

handlePreToolUse(claudeDir, input.session_id, input.tool_input || {})
  .then((result) => console.log(JSON.stringify(result)))
  .catch((err) => {
    console.error('pre-tool-use hook failed:', err);
    process.exit(1);
  });
