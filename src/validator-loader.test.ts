import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadValidators } from './validator-loader.js';

describe('loadValidators', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-validators-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when directory does not exist', () => {
    const nonExistentDir = path.join(tempDir, 'validators');

    const result = loadValidators([nonExistentDir]);

    expect(result).toEqual([]);
  });
});
