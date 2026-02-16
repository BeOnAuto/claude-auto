import * as fs from 'node:fs';
import * as path from 'node:path';

export type ContinueMode = 'smart' | 'non-stop' | 'off';
export type CommitMode = 'strict' | 'warn' | 'off';

export interface AutoContinueState {
  mode: ContinueMode;
  maxIterations?: number;
  skipModes: string[];
}

export interface ValidateCommitState {
  mode: CommitMode;
  batchCount?: number;
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
}

export const DEFAULT_HOOK_STATE: HookState = {
  autoContinue: {
    mode: 'smart',
    maxIterations: 0,
    skipModes: ['plan'],
  },
  validateCommit: {
    mode: 'strict',
    batchCount: 3,
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
};

export interface HookStateManager {
  read: () => HookState;
  write: (state: HookState) => void;
  update: (updates: Partial<HookState>) => HookState;
}

export function createHookState(autoDir: string): HookStateManager {
  if (!fs.existsSync(autoDir)) {
    fs.mkdirSync(autoDir, { recursive: true });
  }
  const stateFile = path.join(autoDir, '.claude.hooks.json');

  function read(): HookState {
    if (!fs.existsSync(stateFile)) {
      fs.writeFileSync(stateFile, `${JSON.stringify(DEFAULT_HOOK_STATE, null, 2)}\n`);
      return { ...DEFAULT_HOOK_STATE };
    }

    const content = fs.readFileSync(stateFile, 'utf-8');
    const partial = JSON.parse(content) as Partial<HookState>;

    return {
      autoContinue: { ...DEFAULT_HOOK_STATE.autoContinue, ...partial.autoContinue },
      validateCommit: { ...DEFAULT_HOOK_STATE.validateCommit, ...partial.validateCommit },
      denyList: { ...DEFAULT_HOOK_STATE.denyList, ...partial.denyList },
      promptReminder: { ...DEFAULT_HOOK_STATE.promptReminder, ...partial.promptReminder },
      subagentHooks: { ...DEFAULT_HOOK_STATE.subagentHooks, ...partial.subagentHooks },
    };
  }

  function write(state: HookState): void {
    fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  }

  function update(updates: Partial<HookState>): HookState {
    const current = read();
    const newState: HookState = {
      ...current,
      ...updates,
      autoContinue: { ...current.autoContinue, ...updates.autoContinue },
      validateCommit: { ...current.validateCommit, ...updates.validateCommit },
      denyList: { ...current.denyList, ...updates.denyList },
      promptReminder: { ...current.promptReminder, ...updates.promptReminder },
      subagentHooks: { ...current.subagentHooks, ...updates.subagentHooks },
    };
    write(newState);
    return newState;
  }

  return {
    read,
    write,
    update,
  };
}
