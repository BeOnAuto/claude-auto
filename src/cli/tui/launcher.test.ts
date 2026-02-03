import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { launchTui } from './launcher.js';

describe('launchTui', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launcher-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns error when directory is not configured', () => {
    const writes: string[] = [];
    const result = launchTui({
      dir: tempDir,
      write: (s) => writes.push(s),
      cols: 80,
      rows: 24,
    });

    expect(result).toEqual({ ok: false, reason: 'not-configured' });
  });

  it('returns tui handle when directory is configured', () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');

    const writes: string[] = [];
    const result = launchTui({
      dir: tempDir,
      write: (s) => writes.push(s),
      cols: 80,
      rows: 24,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      result.tui.stop();
    }
  });
});
