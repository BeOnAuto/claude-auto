import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { SubagentHooksState } from '../hook-state.js';
import type { SubagentType } from '../subagent-classifier.js';

export interface ClaudeMdResult {
  content: string;
  path: string;
}

export function findClaudeMd(dir: string): ClaudeMdResult | undefined {
  while (dir !== '/') {
    const filePath = join(dir, 'CLAUDE.md');
    try {
      return { content: readFileSync(filePath, 'utf8'), path: filePath };
    } catch {
      dir = dirname(dir);
    }
  }
  return undefined;
}

export function getEffectiveCwd(command: string, baseCwd: string): string {
  const cdMatch = command.match(/^cd\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*&&/);
  if (cdMatch) {
    const targetDir = cdMatch[1] || cdMatch[2] || cdMatch[3];
    return resolve(baseCwd, targetDir);
  }
  return baseCwd;
}

export function extractGitCPath(command: string): string | undefined {
  const match = command.match(/git\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  if (match) {
    return match[1] || match[2] || match[3];
  }
  return undefined;
}

export function findGitRoot(dir: string): string | undefined {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (result.status === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return undefined;
}

export function shouldValidateCommit(
  subagentType: SubagentType,
  state: SubagentHooksState,
): boolean {
  switch (subagentType) {
    case 'explore':
      return state.validateCommitOnExplore;
    case 'work':
      return state.validateCommitOnWork;
    case 'unknown':
      return state.validateCommitOnUnknown;
  }
}
