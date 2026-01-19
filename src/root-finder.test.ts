import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findProjectRoot } from './root-finder.js';

describe('root-finder', () => {
  let tempDir: string;

  beforeEach(() => {
    vi.unstubAllEnvs();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('findProjectRoot', () => {
    it('uses KETCHUP_ROOT env var when set', () => {
      const customRoot = path.join(tempDir, 'custom-root');
      fs.mkdirSync(customRoot, { recursive: true });
      vi.stubEnv('KETCHUP_ROOT', customRoot);
      vi.stubEnv('INIT_CWD', '');

      const result = findProjectRoot();
      expect(result).toBe(customRoot);
    });

    it('uses INIT_CWD when KETCHUP_ROOT not set', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', projectDir);

      const result = findProjectRoot();
      expect(result).toBe(projectDir);
    });

    it('falls back to cwd when no env vars set', () => {
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', '');

      const result = findProjectRoot();
      expect(result).toBe(process.cwd());
    });
  });
});
