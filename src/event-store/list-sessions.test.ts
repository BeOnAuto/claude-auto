import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sqliteConnection } from '@event-driven-io/emmett-sqlite';
import { describe, expect, it } from 'vitest';

import { ingestSession } from './ingest-session.js';
import { listSessions } from './list-sessions.js';
import { createEventStore } from './store.js';

function sessionStartLine(sessionId: string, timestamp: string): string {
  return JSON.stringify({
    type: 'progress',
    data: {
      type: 'hook_progress',
      hookEvent: 'SessionStart',
      hookName: 'SessionStart:startup',
      command: 'node s.js',
    },
    uuid: `u-${sessionId}-start`,
    timestamp,
    sessionId,
    cwd: 'c',
    gitBranch: 'b',
    version: 'v',
    entrypoint: 'e',
  });
}

function userPromptLine(sessionId: string, timestamp: string, prompt: string): string {
  return JSON.stringify({
    type: 'user',
    uuid: `u-${sessionId}-prompt`,
    timestamp,
    sessionId,
    message: { content: prompt },
  });
}

describe('listSessions', () => {
  it('returns summaries ordered by recency including the first prompt as summary', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ls-'));
    const dbPath = join(dir, 'events.db');
    const store = await createEventStore(dbPath);

    const olderJsonl = join(dir, 'older.jsonl');
    writeFileSync(
      olderJsonl,
      `${sessionStartLine('abc', '2026-04-20T10:00:00Z')}\n${userPromptLine('abc', '2026-04-20T10:00:05Z', 'hello from abc')}\n`,
    );
    await ingestSession(olderJsonl, store);

    const newerJsonl = join(dir, 'newer.jsonl');
    writeFileSync(newerJsonl, `${sessionStartLine('xyz', '2026-04-20T11:00:00Z')}\n`);
    await ingestSession(newerJsonl, store);

    const connection = sqliteConnection({ fileName: dbPath });
    const sessions = await listSessions(connection);
    connection.close();

    expect(sessions).toEqual([
      {
        sessionId: 'xyz',
        eventCount: 2,
        firstTimestamp: '2026-04-20T11:00:00Z',
        lastTimestamp: '2026-04-20T11:00:00Z',
        summary: '',
      },
      {
        sessionId: 'abc',
        eventCount: 3,
        firstTimestamp: '2026-04-20T10:00:00Z',
        lastTimestamp: '2026-04-20T10:00:05Z',
        summary: 'hello from abc',
      },
    ]);
  });
});
