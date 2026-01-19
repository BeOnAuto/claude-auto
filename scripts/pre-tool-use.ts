#!/usr/bin/env npx tsx
import * as path from 'node:path';

import { handlePreToolUse } from '../src/hooks/pre-tool-use.js';

const claudeDir = path.resolve(process.cwd(), '.claude');
const toolInput = JSON.parse(process.argv[2] || '{}');
const result = handlePreToolUse(claudeDir, toolInput);

console.log(JSON.stringify(result));
