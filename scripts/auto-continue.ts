#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

import { handleStop, type StopHookInput } from '../src/hooks/auto-continue.js';

const projectDir = process.cwd();
const stdin = fs.readFileSync(0, 'utf8').trim();

if (!stdin) {
  process.exit(0);
}

const input: StopHookInput = JSON.parse(stdin);
const result = handleStop(projectDir, input);

if (result.decision === 'block') {
  console.log(JSON.stringify({
    stopReason: result.reason,
    forceResult: {
      behaviour: 'block',
    },
  }));
}

process.exit(0);
