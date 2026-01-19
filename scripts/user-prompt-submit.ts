#!/usr/bin/env npx tsx
import * as path from 'node:path';

import { handleUserPromptSubmit } from '../src/hooks/user-prompt-submit.js';

const claudeDir = path.resolve(process.cwd(), '.claude');
const userPrompt = process.argv[2] || '';
const result = handleUserPromptSubmit(claudeDir, userPrompt);

console.log(JSON.stringify(result));
