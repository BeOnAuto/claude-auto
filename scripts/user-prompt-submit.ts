#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { handleUserPromptSubmit } from '../src/hooks/user-prompt-submit.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const result = handleUserPromptSubmit(claudeDir, input.session_id, input.prompt || '');

console.log(JSON.stringify(result));
