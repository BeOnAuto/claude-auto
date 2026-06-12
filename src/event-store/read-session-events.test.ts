import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ingestSession } from './ingest-session.js';
import { readSessionEvents } from './read-session-events.js';
import { createEventStore } from './store.js';

describe('readSessionEvents', () => {
  it('returns domain events for the given session in stream order', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rse-'));
    const dbPath = join(dir, 'events.db');
    const jsonlPath = join(dir, 'session.jsonl');
    const sessionStart = JSON.stringify({
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node s.js',
      },
      uuid: 'u1',
      timestamp: '2026-04-20T10:00:00Z',
      sessionId: 'abc',
      cwd: '/work',
      gitBranch: 'main',
      version: '1.0',
      entrypoint: 'cli',
    });
    writeFileSync(jsonlPath, `${sessionStart}\n`);
    const store = await createEventStore(dbPath);
    await ingestSession(jsonlPath, store);

    const events = await readSessionEvents(store, 'abc');

    expect(events.map((e) => e.type)).toEqual(['SessionStarted', 'HookExecuted']);
    expect(events[0]).toEqual({
      type: 'SessionStarted',
      sessionId: 'abc',
      cwd: '/work',
      gitBranch: 'main',
      version: '1.0',
      entrypoint: 'cli',
      timestamp: '2026-04-20T10:00:00Z',
      source: { line: sessionStart, uuid: 'u1' },
    });
  });
});
