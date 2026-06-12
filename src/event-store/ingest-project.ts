import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { SQLiteEventStore } from '@event-driven-io/emmett-sqlite';

import { ingestSession } from './ingest-session.js';
import type { SessionEvent } from './translate-session.js';

type SessionIngester = (jsonlPath: string, store: SQLiteEventStore) => Promise<SessionEvent[] | void>;

export async function ingestProject(
  projectDir: string,
  store: SQLiteEventStore,
  ingester: SessionIngester = ingestSession,
): Promise<void> {
  const entries = await readdir(projectDir);
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    await ingester(join(projectDir, name), store);
  }
}
