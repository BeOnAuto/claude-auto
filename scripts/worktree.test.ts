import { describe, expect, it, vi } from 'vitest';
import type { WorktreeManager } from '../src/worktree-manager.js';
import type { WorktreeInfo } from '../src/worktree-state.js';
import { runCommand, usage } from './worktree.js';

function createMockManager(worktrees: WorktreeInfo[] = []): WorktreeManager {
  return {
    list: vi.fn(() => worktrees),
    create: vi.fn((branch: string, options?: { baseBranch?: string; path?: string }) => ({
      id: 'wt-123-0',
      branch,
      path: options?.path ?? '/tmp/test-worktree',
      baseBranch: options?.baseBranch ?? 'main',
      status: 'active' as const,
      createdAt: '2026-03-25T00:00:00.000Z',
    })),
    remove: vi.fn(),
    isHealthy: vi.fn((id: string) => worktrees.some((w) => w.id === id)),
  };
}

const sampleWorktree: WorktreeInfo = {
  id: 'wt-100-0',
  branch: 'worktree/my-feature',
  path: '/tmp/my-worktree',
  baseBranch: 'main',
  status: 'active',
  createdAt: '2026-03-25T00:00:00.000Z',
};

const expectedUsage = `Usage: /claude-auto:worktree <command> [args]

Commands:
  list                                    Show all tracked worktrees and their status
  status <id>                             Check health of a specific worktree
  create <branch> [--base <branch>] [--path <path>]  Create a new worktree
  remove <id>                             Remove a worktree and clean up
  merge <id>                              Show merge command for worktree branch`;

describe('worktree script', () => {
  describe('usage', () => {
    it('returns usage text with all commands', () => {
      expect(usage()).toEqual(expectedUsage);
    });
  });

  describe('runCommand', () => {
    it('returns usage for unknown command', () => {
      const manager = createMockManager();
      expect(runCommand(undefined, [], manager)).toEqual({
        output: expectedUsage,
      });
    });

    describe('list', () => {
      it('shows no worktrees message when empty', () => {
        const manager = createMockManager();
        expect(runCommand('list', [], manager)).toEqual({
          output: 'No active worktrees.',
        });
      });

      it('shows worktrees when present', () => {
        const manager = createMockManager([sampleWorktree]);
        expect(runCommand('list', [], manager)).toEqual({
          output: 'Active Worktrees:\n- wt-100-0: worktree/my-feature at /tmp/my-worktree (active)',
        });
      });
    });

    describe('status', () => {
      it('returns error when no id provided', () => {
        const manager = createMockManager();
        expect(runCommand('status', [], manager)).toEqual({
          output: 'Usage: worktree status <id>',
          error: true,
        });
      });

      it('reports healthy for existing worktree', () => {
        const manager = createMockManager([sampleWorktree]);
        expect(runCommand('status', ['wt-100-0'], manager)).toEqual({
          output: 'Worktree wt-100-0 is healthy.',
        });
      });

      it('reports unhealthy for missing worktree', () => {
        const manager = createMockManager();
        expect(runCommand('status', ['wt-missing'], manager)).toEqual({
          output: 'Worktree wt-missing is not found or unhealthy.',
        });
      });
    });

    describe('create', () => {
      it('returns error when no branch provided', () => {
        const manager = createMockManager();
        expect(runCommand('create', [], manager)).toEqual({
          output: 'Usage: worktree create <branch> [--base <branch>] [--path <path>]',
          error: true,
        });
      });

      it('creates worktree with defaults', () => {
        const manager = createMockManager();
        const result = runCommand('create', ['my-feature'], manager);
        expect({ result, calls: (manager.create as ReturnType<typeof vi.fn>).mock.calls }).toEqual({
          result: {
            output:
              'Created worktree:\n  ID: wt-123-0\n  Branch: worktree/my-feature\n  Path: /tmp/test-worktree\n  Base: main',
          },
          calls: [['worktree/my-feature', { baseBranch: undefined, path: undefined }]],
        });
      });

      it('creates worktree with base and path options', () => {
        const manager = createMockManager();
        const result = runCommand('create', ['feat', '--base', 'develop', '--path', '/tmp/wt'], manager);
        expect({ result, calls: (manager.create as ReturnType<typeof vi.fn>).mock.calls }).toEqual({
          result: {
            output: 'Created worktree:\n  ID: wt-123-0\n  Branch: worktree/feat\n  Path: /tmp/wt\n  Base: develop',
          },
          calls: [['worktree/feat', { baseBranch: 'develop', path: '/tmp/wt' }]],
        });
      });
    });

    describe('remove', () => {
      it('returns error when no id provided', () => {
        const manager = createMockManager();
        expect(runCommand('remove', [], manager)).toEqual({
          output: 'Usage: worktree remove <id>',
          error: true,
        });
      });

      it('removes worktree by id', () => {
        const manager = createMockManager([sampleWorktree]);
        const result = runCommand('remove', ['wt-100-0'], manager);
        expect({ result, calls: (manager.remove as ReturnType<typeof vi.fn>).mock.calls }).toEqual({
          result: { output: 'Removed worktree: wt-100-0' },
          calls: [['wt-100-0']],
        });
      });
    });

    describe('merge', () => {
      it('returns error when no id provided', () => {
        const manager = createMockManager();
        expect(runCommand('merge', [], manager)).toEqual({
          output: 'Usage: worktree merge <id>',
          error: true,
        });
      });

      it('returns not found for unknown id', () => {
        const manager = createMockManager();
        expect(runCommand('merge', ['wt-missing'], manager)).toEqual({
          output: 'Worktree wt-missing not found.',
        });
      });

      it('returns merge command for existing worktree', () => {
        const manager = createMockManager([sampleWorktree]);
        expect(runCommand('merge', ['wt-100-0'], manager)).toEqual({
          output: 'To merge: git merge worktree/my-feature',
        });
      });
    });
  });
});
