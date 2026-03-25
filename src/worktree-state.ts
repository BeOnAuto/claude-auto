import * as fs from 'node:fs';
import * as path from 'node:path';

export interface WorktreeInfo {
  id: string;
  path: string;
  branch: string;
  baseBranch: string;
  status: 'active' | 'merged' | 'abandoned';
  createdAt: string;
  planFile?: string;
  sessionId?: string;
}

export interface WorktreeState {
  worktrees: Record<string, WorktreeInfo>;
  defaultBasePath?: string;
}

export interface WorktreeStateManager {
  read: () => WorktreeState;
  write: (state: WorktreeState) => void;
  addWorktree: (info: WorktreeInfo) => void;
  removeWorktree: (id: string) => void;
  updateWorktree: (id: string, updates: Partial<WorktreeInfo>) => void;
  getWorktree: (id: string) => WorktreeInfo | undefined;
}

export function createWorktreeState(autoDir: string): WorktreeStateManager {
  if (!fs.existsSync(autoDir)) {
    fs.mkdirSync(autoDir, { recursive: true });
  }
  const stateFile = path.join(autoDir, '.worktrees.json');

  function read(): WorktreeState {
    if (!fs.existsSync(stateFile)) {
      return { worktrees: {} };
    }
    const content = fs.readFileSync(stateFile, 'utf-8');
    return JSON.parse(content) as WorktreeState;
  }

  function write(state: WorktreeState): void {
    fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  }

  function addWorktree(info: WorktreeInfo): void {
    const state = read();
    state.worktrees[info.id] = info;
    write(state);
  }

  function removeWorktree(id: string): void {
    const state = read();
    delete state.worktrees[id];
    write(state);
  }

  function updateWorktree(id: string, updates: Partial<WorktreeInfo>): void {
    const state = read();
    const existing = state.worktrees[id];
    if (existing) {
      state.worktrees[id] = { ...existing, ...updates };
      write(state);
    }
  }

  function getWorktree(id: string): WorktreeInfo | undefined {
    const state = read();
    return state.worktrees[id];
  }

  return {
    read,
    write,
    addWorktree,
    removeWorktree,
    updateWorktree,
    getWorktree,
  };
}
