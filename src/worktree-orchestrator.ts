import type { WorktreeInfo } from './worktree-state.js';

export function buildSubAgentPrompt(worktree: WorktreeInfo, burstDescription: string, planContext: string): string {
  return `You are working in a git worktree at ${worktree.path} on branch ${worktree.branch} (based on ${worktree.baseBranch}).

cd ${worktree.path}

## Your Task

${burstDescription}

## Plan Context

${planContext}

## Rules

- All hooks, validators, and reminders are active in this worktree
- Commit frequently following TCR discipline
- When done, summarize what was accomplished and list all commits made`;
}

export function generateMergeCommand(worktree: WorktreeInfo): string {
  return `git merge ${worktree.branch}`;
}

export function formatWorktreeStatus(worktrees: WorktreeInfo[]): string {
  if (worktrees.length === 0) {
    return 'No active worktrees.';
  }
  const lines = worktrees.map((wt) => `- ${wt.id}: ${wt.branch} at ${wt.path} (${wt.status})`);
  return `Active Worktrees:\n${lines.join('\n')}`;
}
