import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHookState, DEFAULT_HOOK_STATE, type HookState } from './hook-state.js';

describe('hook-state', () => {
  let tempDir: string;
  let autoDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-hookstate-'));
    autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('createHookState', () => {
    it('exists returns false before read and true after read', () => {
      const hookState = createHookState(autoDir);

      expect(hookState.exists()).toBe(false);

      hookState.read();

      expect(hookState.exists()).toBe(true);
    });

    it('sets firstSetupRequired when created in plugin mode', () => {
      vi.stubEnv('CLAUDE_PLUGIN_ROOT', '/plugins/claude-auto');
      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.firstSetupRequired).toBe(true);
      vi.unstubAllEnvs();
    });

    it('does not set firstSetupRequired when created in legacy mode', () => {
      delete process.env.CLAUDE_PLUGIN_ROOT;
      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.firstSetupRequired).toBeUndefined();
    });

    it('creates state file with defaults when not exists', () => {
      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('smart');
      expect(state.validateCommit.mode).toBe('strict');
      expect(state.denyList.enabled).toBe(true);
      expect(state.promptReminder.enabled).toBe(true);
    });

    it('reads existing state file', () => {
      const existingState: HookState = {
        autoContinue: { mode: 'non-stop', maxIterations: 5, skipModes: ['plan'] },
        validateCommit: { mode: 'warn' },
        denyList: { enabled: false },
        promptReminder: { enabled: false },
        subagentHooks: { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true },
        overrides: { validators: {}, reminders: {} },
      };
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('non-stop');
      expect(state.validateCommit.mode).toBe('warn');
    });

    it('merges partial state with defaults', () => {
      const partialState = { autoContinue: { mode: 'off' } };
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify(partialState));

      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('off');
      expect(state.validateCommit.mode).toBe('strict');
      expect(state.denyList.enabled).toBe(true);
    });

    it('merges batchCount from partial state file', () => {
      const partialState = { validateCommit: { mode: 'strict', batchCount: 5 } };
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify(partialState));

      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.validateCommit).toEqual({ mode: 'strict', batchCount: 5 });
    });

    it('reads legacy files with volatile fields without breaking', () => {
      const legacyState = {
        autoContinue: { mode: 'smart', maxIterations: 0, iteration: 3, skipModes: ['plan'] },
        validateCommit: { mode: 'strict' },
        denyList: { enabled: true },
        promptReminder: { enabled: true },
        subagentHooks: { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true },
        updatedAt: '2026-01-01T00:00:00Z',
        updatedBy: 'legacy',
      };
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify(legacyState));

      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('smart');
      expect(state.validateCommit.mode).toBe('strict');
    });
  });

  describe('write', () => {
    it('writes state to .claude-auto/.claude.hooks.json', () => {
      const hookState = createHookState(autoDir);
      const newState: HookState = {
        ...DEFAULT_HOOK_STATE,
        autoContinue: { ...DEFAULT_HOOK_STATE.autoContinue, mode: 'non-stop' },
      };

      hookState.write(newState);

      const content = JSON.parse(fs.readFileSync(path.join(autoDir, '.claude.hooks.json'), 'utf-8'));
      expect(content.autoContinue.mode).toBe('non-stop');
    });

    it('does not add volatile fields to written file', () => {
      const hookState = createHookState(autoDir);
      const state = hookState.read();

      hookState.write(state);

      const content = JSON.parse(fs.readFileSync(path.join(autoDir, '.claude.hooks.json'), 'utf-8'));
      expect(content.updatedAt).toBeUndefined();
      expect(content.updatedBy).toBeUndefined();
      expect(content.autoContinue.iteration).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates specific fields and preserves others', () => {
      const hookState = createHookState(autoDir);

      hookState.update({ validateCommit: { mode: 'off' } });

      const state = hookState.read();
      expect(state.validateCommit.mode).toBe('off');
      expect(state.autoContinue.mode).toBe('smart');
    });

    it('updates overrides via update method', () => {
      const hookState = createHookState(autoDir);

      hookState.update({
        overrides: {
          validators: { 'my-val': { enabled: false } },
          reminders: { 'my-rem': { priority: 50 } },
        },
      });

      const state = hookState.read();
      expect(state.overrides.validators['my-val']).toEqual({ enabled: false });
      expect(state.overrides.reminders['my-rem']).toEqual({ priority: 50 });
    });
  });

  describe('DEFAULT_HOOK_STATE', () => {
    it('has expected default values', () => {
      expect(DEFAULT_HOOK_STATE).toEqual({
        autoContinue: { mode: 'smart', maxIterations: 0, skipModes: ['plan'] },
        validateCommit: { mode: 'strict', batchCount: 3 },
        denyList: { enabled: true, extraPatterns: [] },
        promptReminder: { enabled: true },
        subagentHooks: { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true },
        overrides: { validators: {}, reminders: {} },
      });
    });

    it('has subagentHooks with default values', () => {
      expect(DEFAULT_HOOK_STATE.subagentHooks).toEqual({
        validateCommitOnExplore: false,
        validateCommitOnWork: true,
        validateCommitOnUnknown: true,
      });
    });
  });

  describe('subagentHooks', () => {
    it('reads subagentHooks from state file', () => {
      const existingState = {
        subagentHooks: {
          validateCommitOnExplore: true,
          validateCommitOnWork: false,
          validateCommitOnUnknown: false,
        },
      };
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(autoDir);
      const state = hookState.read();

      expect(state.subagentHooks.validateCommitOnExplore).toBe(true);
      expect(state.subagentHooks.validateCommitOnWork).toBe(false);
      expect(state.subagentHooks.validateCommitOnUnknown).toBe(false);
    });

    it('updates subagentHooks with update method', () => {
      const hookState = createHookState(autoDir);

      hookState.update({
        subagentHooks: { validateCommitOnExplore: true, validateCommitOnWork: true, validateCommitOnUnknown: true },
      });

      const state = hookState.read();
      expect(state.subagentHooks.validateCommitOnExplore).toBe(true);
    });
  });
});
