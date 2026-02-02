import * as fs from 'node:fs';
import * as path from 'node:path';

export type ContinueMode = 'smart' | 'non-stop' | 'off';
export type CommitMode = 'strict' | 'warn' | 'off';

export interface AutoContinueState {
  mode: ContinueMode;
  maxIterations?: number;
  iteration?: number;
  skipModes?: string[];
}

export interface ValidateCommitState {
  mode: CommitMode;
}

export interface DenyListState {
  enabled: boolean;
  extraPatterns?: string[];
}

export interface PromptReminderState {
  enabled: boolean;
  customReminder?: string;
}

export interface SubagentHooksState {
  validateCommitOnExplore: boolean;
  validateCommitOnWork: boolean;
  validateCommitOnUnknown: boolean;
}

export interface HookState {
  autoContinue: AutoContinueState;
  validateCommit: ValidateCommitState;
  denyList: DenyListState;
  promptReminder: PromptReminderState;
  subagentHooks: SubagentHooksState;
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_HOOK_STATE: HookState = {
  autoContinue: {
    mode: 'smart',
    maxIterations: 0,
    iteration: 0,
    skipModes: ['plan'],
  },
  validateCommit: {
    mode: 'strict',
  },
  denyList: {
    enabled: true,
    extraPatterns: [],
  },
  promptReminder: {
    enabled: true,
  },
  subagentHooks: {
    validateCommitOnExplore: false,
    validateCommitOnWork: true,
    validateCommitOnUnknown: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'default',
};

export interface HookStateManager {
  read: () => HookState;
  write: (state: HookState) => void;
  update: (updates: Partial<HookState>, updatedBy?: string) => HookState;
  incrementIteration: () => number;
  resetIteration: () => void;
}

export function createHookState(ketchupDir: string): HookStateManager {
  if (!fs.existsSync(ketchupDir)) {
    fs.mkdirSync(ketchupDir, { recursive: true });
  }
  const stateFile = path.join(ketchupDir, '.claude.hooks.json');

  function read(): HookState {
    if (!fs.existsSync(stateFile)) {
      const state = { ...DEFAULT_HOOK_STATE, updatedAt: new Date().toISOString(), updatedBy: 'init' };
      fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
      return state;
    }

    const content = fs.readFileSync(stateFile, 'utf-8');
    const partial = JSON.parse(content) as Partial<HookState>;

    return {
      autoContinue: { ...DEFAULT_HOOK_STATE.autoContinue, ...partial.autoContinue },
      validateCommit: { ...DEFAULT_HOOK_STATE.validateCommit, ...partial.validateCommit },
      denyList: { ...DEFAULT_HOOK_STATE.denyList, ...partial.denyList },
      promptReminder: { ...DEFAULT_HOOK_STATE.promptReminder, ...partial.promptReminder },
      subagentHooks: { ...DEFAULT_HOOK_STATE.subagentHooks, ...partial.subagentHooks },
      updatedAt: partial.updatedAt ?? DEFAULT_HOOK_STATE.updatedAt,
      updatedBy: partial.updatedBy,
    };
  }

  function write(state: HookState): void {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  }

  function update(updates: Partial<HookState>, updatedBy?: string): HookState {
    const current = read();
    const newState: HookState = {
      ...current,
      ...updates,
      autoContinue: { ...current.autoContinue, ...updates.autoContinue },
      validateCommit: { ...current.validateCommit, ...updates.validateCommit },
      denyList: { ...current.denyList, ...updates.denyList },
      promptReminder: { ...current.promptReminder, ...updates.promptReminder },
      subagentHooks: { ...current.subagentHooks, ...updates.subagentHooks },
      updatedBy: updatedBy ?? 'unknown',
      updatedAt: current.updatedAt,
    };
    write(newState);
    return newState;
  }

  function incrementIteration(): number {
    const state = read();
    state.autoContinue.iteration = (state.autoContinue.iteration as number) + 1;
    write(state);
    return state.autoContinue.iteration;
  }

  function resetIteration(): void {
    const state = read();
    state.autoContinue.iteration = 0;
    write(state);
  }

  return {
    read,
    write,
    update,
    incrementIteration,
    resetIteration,
  };
}
