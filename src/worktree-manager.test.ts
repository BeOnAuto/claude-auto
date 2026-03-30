import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWorktreeManager,
  type GitExecutor,
  generateBranchName,
  generateWorktreePath,
} from './worktree-manager.js';

describe('worktree-manager', () => {
  let tempDir: string;
  let autoDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-worktreemgr-'));
    autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('generateWorktreePath', () => {
    it('returns path in parent directory with adjective-noun suffix', () => {
      const repoPath = '/home/user/projects/my-repo';
      const result = generateWorktreePath(repoPath, () => 0);

      expect(result).toBe(path.resolve('/home/user/projects', 'my-repo-swift-fox'));
    });

    it('uses injected randomFn for deterministic testing', () => {
      const repoPath = '/home/user/projects/my-repo';
      const result = generateWorktreePath(repoPath, () => 0.99);

      expect(result).toBe(path.resolve('/home/user/projects', 'my-repo-arch-wax'));
    });
  });

  describe('generateBranchName', () => {
    it('slugifies feature names correctly', () => {
      expect(generateBranchName('Add User Authentication')).toBe('worktree/add-user-authentication');
    });

    it('handles special characters', () => {
      expect(generateBranchName('fix: bug #123 (urgent!)')).toBe('worktree/fix-bug-123-urgent');
    });

    it('collapses multiple hyphens and trims', () => {
      expect(generateBranchName('--hello---world--')).toBe('worktree/hello-world');
    });
  });

  describe('createWorktreeManager', () => {
    let mockExecutor: GitExecutor;

    beforeEach(() => {
      mockExecutor = vi.fn().mockReturnValue('');
    });

    describe('create', () => {
      it('calls git worktree add with correct args', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        manager.create('worktree/feature-a');

        const call = (mockExecutor as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0].slice(0, 4)).toEqual(['worktree', 'add', '-b', 'worktree/feature-a']);
        expect(call[0][5]).toBe('main');
        expect(call[1]).toBe(tempDir);
      });

      it('persists worktree info to state', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        const info = manager.create('worktree/feature-a');

        expect(info).toEqual({
          id: expect.stringMatching(/^wt-/),
          path: expect.any(String),
          branch: 'worktree/feature-a',
          baseBranch: 'main',
          status: 'active',
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        });

        const listed = manager.list();
        expect(listed).toHaveLength(1);
        expect(listed[0]).toEqual(info);
      });

      it('uses custom path when provided', () => {
        const customPath = path.join(tempDir, 'custom-worktree');
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        const info = manager.create('worktree/feature-b', { path: customPath });

        expect(info.path).toBe(customPath);
        const call = (mockExecutor as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0][4]).toBe(customPath);
      });

      it('uses custom base branch when provided', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        manager.create('worktree/feature-c', { baseBranch: 'develop' });

        const call = (mockExecutor as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0][5]).toBe('develop');
      });
    });

    describe('list', () => {
      it('returns all worktrees from state', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        manager.create('worktree/feature-a');
        manager.create('worktree/feature-b');

        const listed = manager.list();
        expect(listed).toHaveLength(2);
        expect(listed.map((w) => w.branch).sort()).toEqual(['worktree/feature-a', 'worktree/feature-b']);
      });
    });

    describe('remove', () => {
      it('calls git worktree remove and removes from state', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);
        const info = manager.create('worktree/feature-a');

        manager.remove(info.id);

        expect(mockExecutor).toHaveBeenCalledWith(['worktree', 'remove', '--force', info.path], tempDir);
        expect(manager.list()).toHaveLength(0);
      });
    });

    describe('isHealthy', () => {
      it('returns false for non-existent worktree', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);

        expect(manager.isHealthy('non-existent')).toBe(false);
      });

      it('returns true when path exists on disk', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);
        const worktreePath = path.join(tempDir, 'existing-worktree');
        fs.mkdirSync(worktreePath, { recursive: true });

        const info = manager.create('worktree/feature-a', { path: worktreePath });

        expect(manager.isHealthy(info.id)).toBe(true);
      });

      it('returns false when path does not exist on disk', () => {
        const manager = createWorktreeManager(tempDir, autoDir, mockExecutor);
        const worktreePath = path.join(tempDir, 'nonexistent-worktree');

        const info = manager.create('worktree/feature-a', { path: worktreePath });

        expect(manager.isHealthy(info.id)).toBe(false);
      });
    });
  });
});
