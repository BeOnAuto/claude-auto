#!/usr/bin/env npx tsx

import { runPostinstall } from '../src/postinstall.js';

runPostinstall().catch((err) => {
  console.error('Postinstall failed:', err);
  process.exit(1);
});
