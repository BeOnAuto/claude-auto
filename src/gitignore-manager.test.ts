import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateGitignore } from './gitignore-manager.js';

describe('gitignore-manager', () => {
  describe('generateGitignore', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('creates .gitignore file in the target directory', () => {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      generateGitignore(claudeDir, []);

      expect(fs.existsSync(path.join(claudeDir, '.gitignore'))).toBe(true);
    });

    it('includes symlinked files in gitignore', () => {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      generateGitignore(claudeDir, ['scripts/session-start.ts', 'skills/ketchup.md']);

      const content = fs.readFileSync(path.join(claudeDir, '.gitignore'), 'utf-8');
      expect(content).toBe('scripts/session-start.ts\nskills/ketchup.md');
    });
  });
});
