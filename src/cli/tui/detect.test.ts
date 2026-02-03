import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isAutoConfigured } from './detect.js';

describe('isAutoConfigured', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false when .ketchup directory does not exist', () => {
    expect(isAutoConfigured(tempDir)).toBe(false);
  });

  it('returns false when .ketchup exists but .claude.hooks.json is missing', () => {
    fs.mkdirSync(path.join(tempDir, '.ketchup'));
    expect(isAutoConfigured(tempDir)).toBe(false);
  });

  it('returns true when .ketchup/.claude.hooks.json exists', () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir);
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');
    expect(isAutoConfigured(tempDir)).toBe(true);
  });
});
