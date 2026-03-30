#!/usr/bin/env npx tsx

import * as path from 'node:path';
import { resolvePathsFromEnv } from '../src/path-resolver.js';
import type { WorktreeManager } from '../src/worktree-manager.js';
import { createWorktreeManager, generateBranchName } from '../src/worktree-manager.js';
import { formatWorktreeStatus, generateMergeCommand } from '../src/worktree-orchestrator.js';

function derivePluginRoot(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

export function usage(): string {
  return `Usage: /claude-auto:worktree <command> [args]

Commands:
  list                                    Show all tracked worktrees and their status
  status <id>                             Check health of a specific worktree
  create <branch> [--base <branch>] [--path <path>]  Create a new worktree
  remove <id>                             Remove a worktree and clean up
  merge <id>                              Show merge command for worktree branch`;
}

export function runCommand(
  subcommand: string | undefined,
  args: string[],
  manager: WorktreeManager,
): { output: string; error?: boolean } {
  switch (subcommand) {
    case 'list': {
      const worktrees = manager.list();
      return { output: formatWorktreeStatus(worktrees) };
    }
    case 'status': {
      const id = args[0];
      if (!id) {
        return { output: 'Usage: worktree status <id>', error: true };
      }
      const healthy = manager.isHealthy(id);
      return { output: healthy ? `Worktree ${id} is healthy.` : `Worktree ${id} is not found or unhealthy.` };
    }
    case 'create': {
      const branch = args[0];
      if (!branch) {
        return { output: 'Usage: worktree create <branch> [--base <branch>] [--path <path>]', error: true };
      }
      const baseIdx = args.indexOf('--base');
      const pathIdx = args.indexOf('--path');
      const baseBranch = baseIdx >= 0 ? args[baseIdx + 1] : undefined;
      const worktreePath = pathIdx >= 0 ? args[pathIdx + 1] : undefined;
      const branchName = generateBranchName(branch);
      const info = manager.create(branchName, { baseBranch, path: worktreePath });
      return {
        output: `Created worktree:\n  ID: ${info.id}\n  Branch: ${info.branch}\n  Path: ${info.path}\n  Base: ${info.baseBranch}`,
      };
    }
    case 'remove': {
      const id = args[0];
      if (!id) {
        return { output: 'Usage: worktree remove <id>', error: true };
      }
      manager.remove(id);
      return { output: `Removed worktree: ${id}` };
    }
    case 'merge': {
      const id = args[0];
      if (!id) {
        return { output: 'Usage: worktree merge <id>', error: true };
      }
      const worktrees = manager.list();
      const wt = worktrees.find((w) => w.id === id);
      if (!wt) {
        return { output: `Worktree ${id} not found.` };
      }
      return { output: `To merge: ${generateMergeCommand(wt)}` };
    }
    default:
      return { output: usage() };
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const subcommand = argv[0];
  const rest = argv.slice(1);

  const paths = await resolvePathsFromEnv(derivePluginRoot());
  const manager = createWorktreeManager(paths.projectRoot, paths.autoDir);

  const result = runCommand(subcommand, rest, manager);

  if (result.error) {
    console.error(result.output);
    process.exit(1);
  }
  console.log(result.output);
}

const isDirectRun = !process.env.VITEST;
if (isDirectRun) {
  main();
}
