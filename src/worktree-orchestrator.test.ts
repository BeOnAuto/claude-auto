import { describe, expect, it } from 'vitest';
import { buildSubAgentPrompt, formatWorktreeStatus, generateMergeCommand } from './worktree-orchestrator.js';
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

describe('buildSubAgentPrompt', () => {
  it('includes worktree path in cd command', () => {
    const result = buildSubAgentPrompt(makeWorktree(), 'do stuff', 'plan');
    expect(result).toContain('cd /tmp/worktrees/burst-1');
  });

  it('includes burst description', () => {
    const result = buildSubAgentPrompt(makeWorktree(), 'implement feature X', 'plan');
    expect(result).toContain('implement feature X');
  });

  it('includes plan context', () => {
    const result = buildSubAgentPrompt(makeWorktree(), 'do stuff', 'the full plan context');
    expect(result).toContain('the full plan context');
  });

  it('includes branch and base branch info', () => {
    const worktree = makeWorktree({ branch: 'feat/my-branch', baseBranch: 'develop' });
    const result = buildSubAgentPrompt(worktree, 'do stuff', 'plan');
    expect(result).toContain('branch feat/my-branch');
    expect(result).toContain('based on develop');
  });

  it('returns full formatted prompt', () => {
    const worktree = makeWorktree();
    const result = buildSubAgentPrompt(worktree, 'do stuff', 'plan context');
    expect(result).toBe(
      `You are working in a git worktree at /tmp/worktrees/burst-1 on branch feat/burst-1 (based on main).

cd /tmp/worktrees/burst-1

## Your Task

do stuff

## Plan Context

plan context

## Rules

- All hooks, validators, and reminders are active in this worktree
- Commit frequently following TCR discipline
- When done, summarize what was accomplished and list all commits made`,
    );
  });
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
