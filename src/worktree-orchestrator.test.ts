import { describe, expect, it } from 'vitest';
import { formatWorktreeStatus, generateMergeCommand } from './worktree-orchestrator.js';
import type { WorktreeInfo } from './worktree-state.js';

const makeWorktree = (overrides: Partial<WorktreeInfo> = {}): WorktreeInfo => ({
  id: 'burst-1',
  path: '/tmp/worktrees/burst-1',
  branch: 'feat/burst-1',
  baseBranch: 'main',
  status: 'active',
  createdAt: '2026-03-25T00:00:00Z',
  ...overrides,
});

describe('generateMergeCommand', () => {
  it('returns correct merge command', () => {
    const worktree = makeWorktree({ branch: 'feat/burst-1' });
    expect(generateMergeCommand(worktree)).toBe('git merge feat/burst-1');
  });
});

describe('formatWorktreeStatus', () => {
  it('returns "No active worktrees." for empty array', () => {
    expect(formatWorktreeStatus([])).toBe('No active worktrees.');
  });

  it('formats multiple worktrees with status', () => {
    const worktrees = [
      makeWorktree({ id: 'burst-1', branch: 'feat/burst-1', path: '/tmp/wt/1', status: 'active' }),
      makeWorktree({ id: 'burst-2', branch: 'feat/burst-2', path: '/tmp/wt/2', status: 'merged' }),
    ];
    expect(formatWorktreeStatus(worktrees)).toBe(
      `Active Worktrees:
- burst-1: feat/burst-1 at /tmp/wt/1 (active)
- burst-2: feat/burst-2 at /tmp/wt/2 (merged)`,
    );
  });
});
