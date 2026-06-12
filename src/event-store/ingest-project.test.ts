import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ingestProject } from './ingest-project.js';
import { createEventStore } from './store.js';

describe('ingestProject', () => {
  it('invokes the session ingester for every *.jsonl file and skips others', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ev-'));
    const projectDir = join(dir, 'project');
    mkdirSync(projectDir);
    writeFileSync(join(projectDir, 'a.jsonl'), '');
    writeFileSync(join(projectDir, 'b.jsonl'), '');
    writeFileSync(join(projectDir, 'notes.txt'), '');
    const store = await createEventStore(join(dir, 'events.db'));
    const ingestedPaths: string[] = [];

    await ingestProject(projectDir, store, async (path) => {
      ingestedPaths.push(path);
    });

    expect(ingestedPaths.sort()).toEqual([join(projectDir, 'a.jsonl'), join(projectDir, 'b.jsonl')]);
  });
});
