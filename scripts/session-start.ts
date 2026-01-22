#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseHookInput } from '../src/hook-input.js';
import { handleSessionStart } from '../src/hooks/session-start.js';

const input = parseHookInput(fs.readFileSync(0, 'utf-8'));
const claudeDir = path.resolve(process.cwd(), '.claude');
const result = handleSessionStart(claudeDir, input.session_id);

console.log(JSON.stringify(result));
