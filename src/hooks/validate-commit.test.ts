import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  findClaudeMd,
  getEffectiveCwd,
  extractGitCPath,
  findGitRoot,
  shouldValidateCommit,
} from './validate-commit.js';

describe('validate-commit hook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-validate-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('findClaudeMd', () => {
    it('finds CLAUDE.md in current directory', () => {
      fs.writeFileSync(path.join(tempDir, 'CLAUDE.md'), '# Rules');

      const result = findClaudeMd(tempDir);

      expect(result).toEqual({
        content: '# Rules',
        path: path.join(tempDir, 'CLAUDE.md'),
      });
    });

    it('finds CLAUDE.md in parent directory', () => {
      const subDir = path.join(tempDir, 'sub', 'folder');
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'CLAUDE.md'), '# Parent Rules');

      const result = findClaudeMd(subDir);

      expect(result).toEqual({
        content: '# Parent Rules',
        path: path.join(tempDir, 'CLAUDE.md'),
      });
    });

    it('returns undefined when CLAUDE.md not found', () => {
      const result = findClaudeMd(tempDir);

      expect(result).toBeUndefined();
    });
  });

  describe('getEffectiveCwd', () => {
    it('returns base cwd when no cd command', () => {
      const result = getEffectiveCwd('git commit -m "test"', '/base');

      expect(result).toBe('/base');
    });

    it('extracts directory from cd command', () => {
      const result = getEffectiveCwd('cd foo && git commit', '/base');

      expect(result).toBe('/base/foo');
    });

    it('handles quoted paths in cd command', () => {
      const result = getEffectiveCwd('cd "foo bar" && git commit', '/base');

      expect(result).toBe('/base/foo bar');
    });

    it('handles single-quoted paths in cd command', () => {
      const result = getEffectiveCwd("cd 'foo bar' && git commit", '/base');

      expect(result).toBe('/base/foo bar');
    });
  });

  describe('extractGitCPath', () => {
    it('returns undefined when no -C flag', () => {
      const result = extractGitCPath('git commit -m "test"');

      expect(result).toBeUndefined();
    });

    it('extracts path from git -C flag', () => {
      const result = extractGitCPath('git -C /path/to/repo commit');

      expect(result).toBe('/path/to/repo');
    });

    it('handles quoted paths', () => {
      const result = extractGitCPath('git -C "/path with spaces" commit');

      expect(result).toBe('/path with spaces');
    });
  });

  describe('findGitRoot', () => {
    it('returns git root for directory in git repo', () => {
      const result = findGitRoot(process.cwd());

      expect(result).toBe(process.cwd());
    });

    it('returns undefined for non-git directory', () => {
      const result = findGitRoot(tempDir);

      expect(result).toBeUndefined();
    });
  });

  describe('shouldValidateCommit', () => {
    it('returns true for work subagent when validateCommitOnWork is true', () => {
      const state = {
        validateCommitOnExplore: false,
        validateCommitOnWork: true,
        validateCommitOnUnknown: true,
      };

      expect(shouldValidateCommit('work', state)).toBe(true);
    });

    it('returns false for explore subagent when validateCommitOnExplore is false', () => {
      const state = {
        validateCommitOnExplore: false,
        validateCommitOnWork: true,
        validateCommitOnUnknown: true,
      };

      expect(shouldValidateCommit('explore', state)).toBe(false);
    });

    it('returns true for unknown subagent when validateCommitOnUnknown is true', () => {
      const state = {
        validateCommitOnExplore: false,
        validateCommitOnWork: true,
        validateCommitOnUnknown: true,
      };

      expect(shouldValidateCommit('unknown', state)).toBe(true);
    });

    it('returns false for work subagent when validateCommitOnWork is false', () => {
      const state = {
        validateCommitOnExplore: true,
        validateCommitOnWork: false,
        validateCommitOnUnknown: true,
      };

      expect(shouldValidateCommit('work', state)).toBe(false);
    });
  });
});
