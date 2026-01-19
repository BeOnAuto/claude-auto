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

    it('finds package.json at INIT_CWD', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', projectDir);

      const result = findProjectRoot();
      expect(result).toBe(projectDir);
    });

    it('falls back to cwd when INIT_CWD path does not exist', () => {
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', '/nonexistent/path');

      const result = findProjectRoot();
      expect(result).toBe(process.cwd());
    });

    it('falls back to cwd when no env vars set', () => {
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', '');

      const result = findProjectRoot();
      expect(result).toBe(process.cwd());
    });

    it('walks up from INIT_CWD to find package.json', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const nestedDir = path.join(projectDir, 'src', 'utils');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', nestedDir);

      const result = findProjectRoot();
      expect(result).toBe(projectDir);
    });

    it('falls back to cwd when no package.json found walking up', () => {
      const isolatedDir = path.join(tempDir, 'isolated');
      fs.mkdirSync(isolatedDir, { recursive: true });
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', isolatedDir);

      const result = findProjectRoot();
      expect(result).toBe(process.cwd());
    });

    it('walks up to find .git when no package.json found', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const nestedDir = path.join(projectDir, 'src', 'utils');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, '.git'));
      vi.stubEnv('KETCHUP_ROOT', '');
      vi.stubEnv('INIT_CWD', nestedDir);

      const result = findProjectRoot();
      expect(result).toBe(projectDir);
    });
  });
});
