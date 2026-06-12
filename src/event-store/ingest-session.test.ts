import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ingestSession } from './ingest-session.js';
import { createEventStore } from './store.js';

describe('ingestSession', () => {
  it('appends translated events to a session-named stream', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ev-'));
    const dbPath = join(dir, 'events.db');
    const jsonlPath = join(dir, 'session.jsonl');
    const sessionStartLine = JSON.stringify({
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node s.js',
      },
      uuid: 'u1',
      timestamp: 't1',
      sessionId: 'abc',
      cwd: 'c',
      gitBranch: 'b',
      version: 'v',
      entrypoint: 'e',
    });
    writeFileSync(jsonlPath, `${sessionStartLine}\n`);
    const store = await createEventStore(dbPath);

    await ingestSession(jsonlPath, store);
    await ingestSession(jsonlPath, store);

    const result = await store.readStream('session-abc');

    expect({
      eventCount: result.events.length,
      eventTypes: result.events.map((e) => e.type),
    }).toEqual({
      eventCount: 2,
      eventTypes: ['SessionStarted', 'HookExecuted'],
    });
  });

  it('returns the events that were newly appended, empty on a re-ingest that adds nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ev-'));
    const dbPath = join(dir, 'events.db');
    const jsonlPath = join(dir, 'session.jsonl');
    const line = JSON.stringify({
      type: 'progress',
      data: { type: 'hook_progress', hookEvent: 'SessionStart', hookName: 'SessionStart:startup', command: 's' },
      uuid: 'u9',
      timestamp: 't9',
      sessionId: 'zzz',
      cwd: 'c',
      gitBranch: 'b',
      version: 'v',
      entrypoint: 'e',
    });
    writeFileSync(jsonlPath, `${line}\n`);
    const store = await createEventStore(dbPath);

    const firstAppended = await ingestSession(jsonlPath, store);
    const secondAppended = await ingestSession(jsonlPath, store);

    expect({
      firstTypes: firstAppended.map((e) => e.type),
      secondTypes: secondAppended.map((e) => e.type),
    }).toEqual({
      firstTypes: ['SessionStarted', 'HookExecuted'],
      secondTypes: [],
    });
  });
});
