import { describe, expect, it } from 'vitest';

import { ingestOnStop } from './ingest-on-stop.js';

interface FakeStore {
  id: string;
}

function makeDeps(calls: string[]) {
  return {
    createStore: async (path: string): Promise<FakeStore> => {
      calls.push(`create:${path}`);
      return { id: 'store' };
    },
    ingest: async (jsonlPath: string, store: FakeStore): Promise<void> => {
      calls.push(`ingest:${jsonlPath}|${store.id}`);
    },
    dbPathFor: (cwd: string): string => `${cwd}/events.db`,
  };
}

describe('ingestOnStop', () => {
  it('creates a store and ingests the transcript when transcript_path is present', async () => {
    const calls: string[] = [];
    await ingestOnStop({ transcript_path: '/a.jsonl', cwd: '/x' }, makeDeps(calls));
    expect(calls).toEqual(['create:/x/events.db', 'ingest:/a.jsonl|store']);
  });

  it('does nothing when transcript_path is missing', async () => {
    const calls: string[] = [];
    await ingestOnStop({ cwd: '/x' }, makeDeps(calls));
    expect(calls).toEqual([]);
  });
});
