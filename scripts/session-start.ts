#!/usr/bin/env npx tsx
import * as path from 'node:path';

import { handleSessionStart } from '../src/hooks/session-start.js';

const claudeDir = path.resolve(process.cwd(), '.claude');
const result = handleSessionStart(claudeDir);

console.log(JSON.stringify(result));
