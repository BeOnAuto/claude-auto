import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { WorktreeInfo } from './worktree-state.js';
import { createWorktreeState } from './worktree-state.js';

export type { WorktreeInfo };

const ADJECTIVES = [
  'swift',
  'calm',
  'bold',
  'warm',
  'cool',
  'keen',
  'fair',
  'wise',
  'kind',
  'pure',
  'deep',
  'soft',
  'dark',
  'wild',
  'tall',
  'fast',
  'gold',
  'blue',
  'red',
  'jade',
  'iron',
  'oak',
  'pine',
  'fern',
  'mint',
  'sage',
  'dawn',
  'dusk',
  'noon',
  'star',
  'moon',
  'sun',
  'rain',
  'snow',
  'wind',
  'fire',
  'sand',
  'clay',
  'ruby',
  'opal',
  'silk',
  'lace',
  'reef',
  'cove',
  'peak',
  'vale',
  'glen',
  'moor',
  'rift',
  'arch',
];

const NOUNS = [
  'fox',
  'owl',
  'elk',
  'bee',
  'ant',
  'ray',
  'bay',
  'elm',
  'ash',
  'yew',
  'fin',
  'gem',
  'orb',
  'arc',
  'hub',
  'den',
  'web',
  'pod',
  'rod',
  'cap',
  'jar',
  'key',
  'map',
  'net',
  'pen',
  'rig',
  'tap',
  'vat',
  'axe',
  'bow',
  'cog',
  'dam',
  'eel',
  'fig',
  'gum',
  'hex',
  'imp',
  'jig',
  'kit',
  'log',
  'mat',
  'nib',
  'oat',
  'peg',
  'ram',
  'sap',
  'tin',
  'urn',
  'vim',
  'wax',
];

export type GitExecutor = (args: string[], cwd: string) => string;

export interface WorktreeManager {
  create: (branch: string, options?: { baseBranch?: string; path?: string }) => WorktreeInfo;
  list: () => WorktreeInfo[];
  remove: (id: string) => void;
  isHealthy: (id: string) => boolean;
}

export function generateWorktreePath(mainRepoPath: string, randomFn: () => number = Math.random): string {
  const parentName = path.basename(mainRepoPath);
  const adjective = ADJECTIVES[Math.floor(randomFn() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(randomFn() * NOUNS.length)];
  return path.resolve(mainRepoPath, '..', `${parentName}-${adjective}-${noun}`);
}

export function generateBranchName(featureName: string): string {
  const slug = featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `worktree/${slug}`;
}

const defaultExecutor: GitExecutor = (args, cwd) => {
  return execSync(['git', ...args].join(' '), { cwd, encoding: 'utf-8' }).trim();
};

export function createWorktreeManager(
  mainRepoPath: string,
  autoDir: string,
  executor: GitExecutor = defaultExecutor,
): WorktreeManager {
  const state = createWorktreeState(autoDir);
  let idCounter = 0;

  function create(branch: string, options?: { baseBranch?: string; path?: string }): WorktreeInfo {
    const worktreePath = options?.path ?? generateWorktreePath(mainRepoPath);
    const baseBranch = options?.baseBranch ?? 'main';

    executor(['worktree', 'add', '-b', branch, worktreePath, baseBranch], mainRepoPath);

    const info: WorktreeInfo = {
      id: `wt-${Date.now()}-${idCounter++}`,
      path: worktreePath,
      branch,
      baseBranch,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    state.addWorktree(info);
    return info;
  }

  function list(): WorktreeInfo[] {
    return Object.values(state.read().worktrees);
  }

  function remove(id: string): void {
    const info = state.getWorktree(id);
    if (info) {
      executor(['worktree', 'remove', '--force', info.path], mainRepoPath);
      state.removeWorktree(id);
    }
  }

  function isHealthy(id: string): boolean {
    const info = state.getWorktree(id);
    if (!info) {
      return false;
    }
    return fs.existsSync(info.path);
  }

  return { create, list, remove, isHealthy };
}
