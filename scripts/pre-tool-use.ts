#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { handlePreToolUse } from '../src/hooks/pre-tool-use.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const result = handlePreToolUse(claudeDir, input.session_id, input.tool_input || {});

console.log(JSON.stringify(result));
