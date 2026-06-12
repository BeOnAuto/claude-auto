import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createEventStore } from './store.js';

describe('createEventStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-eventstore-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('initializes a SQLite-backed event store at the given path', async () => {
    const dbPath = path.join(tempDir, 'events.db');

    const store = await createEventStore(dbPath);

    expect({
      dbFileExists: fs.existsSync(dbPath),
      appendToStream: typeof store.appendToStream,
      readStream: typeof store.readStream,
      aggregateStream: typeof store.aggregateStream,
    }).toEqual({
      dbFileExists: true,
      appendToStream: 'function',
      readStream: 'function',
      aggregateStream: 'function',
    });
  });
});
