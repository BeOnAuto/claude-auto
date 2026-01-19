import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('root-finder', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('findProjectRoot', () => {
    it('uses KETCHUP_ROOT env var when set', async () => {
      const { findProjectRoot } = await import('../src/root-finder.js');

      const customRoot = path.join(tempDir, 'custom-root');
      fs.mkdirSync(customRoot, { recursive: true });
      process.env.KETCHUP_ROOT = customRoot;

      const result = findProjectRoot();
      expect(result).toBe(customRoot);
    });
  });
});
