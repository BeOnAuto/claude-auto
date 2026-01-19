import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runPostinstall } from './postinstall.js';

describe('postinstall', () => {
  describe('runPostinstall', () => {
    let tempDir: string;
    const originalEnv = process.env;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      process.env = originalEnv;
    });

    it('detects project root and returns it', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      const result = runPostinstall();

      expect(result).toEqual({
        projectRoot: projectDir,
        claudeDir: path.join(projectDir, '.claude'),
      });
    });

    it('creates .claude directory in project root', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      runPostinstall();

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
      expect(fs.statSync(path.join(projectDir, '.claude')).isDirectory()).toBe(
        true
      );
    });
  });
});
