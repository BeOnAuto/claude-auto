import { describe, expect, it } from 'vitest';

import { ingestCliRun } from './ingest-cli.js';

describe('ingestCliRun', () => {
  it('creates a store at dbPath and ingests the project directory', async () => {
    const calls: Array<{ op: string; arg: string }> = [];
    const fakeStore = { id: 'fake-store' };

    await ingestCliRun('/proj', '/db.sqlite', {
      createStore: async (path) => {
        calls.push({ op: 'createStore', arg: path });
        return fakeStore;
      },
      ingest: async (projectDir, store) => {
        calls.push({ op: 'ingest', arg: `${projectDir}|${store.id}` });
      },
    });

    expect(calls).toEqual([
      { op: 'createStore', arg: '/db.sqlite' },
      { op: 'ingest', arg: '/proj|fake-store' },
    ]);
  });
});
