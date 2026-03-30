import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMainRepoPath, isWorktree } from './worktree-detector.js';

describe('worktree-detector', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktree-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('isWorktree', () => {
    it('returns false when .git is a directory', () => {
      fs.mkdirSync(path.join(tmpDir, '.git'));
      expect(isWorktree(tmpDir)).toBe(false);
    });

    it('returns true when .git is a file with gitdir content', () => {
      fs.writeFileSync(path.join(tmpDir, '.git'), 'gitdir: /some/main-repo/.git/worktrees/feature-branch\n');
      expect(isWorktree(tmpDir)).toBe(true);
    });

    it('returns false when .git does not exist', () => {
      expect(isWorktree(tmpDir)).toBe(false);
    });

    it('uses process.cwd() when no argument given', () => {
      vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
      fs.writeFileSync(path.join(tmpDir, '.git'), 'gitdir: /some/main-repo/.git/worktrees/feature-branch\n');
      expect(isWorktree()).toBe(true);
    });
  });

  describe('getMainRepoPath', () => {
    it('returns null when not a worktree', () => {
      fs.mkdirSync(path.join(tmpDir, '.git'));
      expect(getMainRepoPath(tmpDir)).toBeNull();
    });

    it('returns the main repo path when in a worktree', () => {
      const mainRepoPath = '/some/main-repo';
      fs.writeFileSync(path.join(tmpDir, '.git'), `gitdir: ${mainRepoPath}/.git/worktrees/feature-branch\n`);
      expect(getMainRepoPath(tmpDir)).toBe(mainRepoPath);
    });

    it('returns null when .git does not exist', () => {
      expect(getMainRepoPath(tmpDir)).toBeNull();
    });

    it('uses process.cwd() when no argument given', () => {
      const mainRepoPath = '/another/main-repo';
      vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
      fs.writeFileSync(path.join(tmpDir, '.git'), `gitdir: ${mainRepoPath}/.git/worktrees/my-branch\n`);
      expect(getMainRepoPath()).toBe(mainRepoPath);
    });
  });
});
