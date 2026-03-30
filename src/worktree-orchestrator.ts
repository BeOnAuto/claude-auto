import type { WorktreeInfo } from './worktree-state.js';

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
