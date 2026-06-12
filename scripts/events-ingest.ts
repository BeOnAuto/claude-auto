#!/usr/bin/env npx tsx

import { resolve } from 'node:path';

import { ingestCliRun } from '../src/event-store/ingest-cli.js';
import { ingestProject } from '../src/event-store/ingest-project.js';
import { createEventStore } from '../src/event-store/store.js';

async function main(): Promise<void> {
  const projectDir = resolve(process.argv[2] ?? process.cwd());
  const dbPath = resolve(process.argv[3] ?? `${projectDir}/events.db`);
  await ingestCliRun(projectDir, dbPath, {
    createStore: createEventStore,
    ingest: ingestProject,
  });
  console.log(`Ingested ${projectDir} → ${dbPath}`);
}

main();
