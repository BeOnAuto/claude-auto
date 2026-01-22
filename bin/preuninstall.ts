#!/usr/bin/env npx tsx

import { runPreuninstall } from '../src/preuninstall.js';

runPreuninstall().catch((err) => {
  console.error('Preuninstall failed:', err);
  process.exit(1);
});
