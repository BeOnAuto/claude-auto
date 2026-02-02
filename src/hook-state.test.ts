import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHookState, DEFAULT_HOOK_STATE, type HookState } from './hook-state.js';

describe('hook-state', () => {
  let tempDir: string;
  let ketchupDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-hookstate-'));
    ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('createHookState', () => {
    it('creates state file with defaults when not exists', () => {
      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('smart');
      expect(state.validateCommit.mode).toBe('strict');
      expect(state.denyList.enabled).toBe(true);
      expect(state.promptReminder.enabled).toBe(true);
    });

    it('reads existing state file', () => {
      const existingState: HookState = {
        autoContinue: { mode: 'non-stop', maxIterations: 5, iteration: 2, skipModes: ['plan'] },
        validateCommit: { mode: 'warn' },
        denyList: { enabled: false },
        promptReminder: { enabled: false },
        subagentHooks: { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true },
        updatedAt: '2026-01-01T00:00:00Z',
        updatedBy: 'test',
      };
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('non-stop');
      expect(state.autoContinue.iteration).toBe(2);
      expect(state.validateCommit.mode).toBe('warn');
    });

    it('merges partial state with defaults', () => {
      const partialState = { autoContinue: { mode: 'off' } };
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(partialState));

      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      expect(state.autoContinue.mode).toBe('off');
      expect(state.validateCommit.mode).toBe('strict');
      expect(state.denyList.enabled).toBe(true);
    });

    it('merges batchCount from partial state file', () => {
      const partialState = { validateCommit: { mode: 'strict', batchCount: 5 } };
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(partialState));

      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      expect(state.validateCommit).toEqual({ mode: 'strict', batchCount: 5 });
    });
  });

  describe('write', () => {
    it('writes state to .ketchup/.claude.hooks.json', () => {
      const hookState = createHookState(ketchupDir);
      const newState: HookState = {
        ...DEFAULT_HOOK_STATE,
        autoContinue: { ...DEFAULT_HOOK_STATE.autoContinue, mode: 'non-stop' },
      };

      hookState.write(newState);

      const content = JSON.parse(fs.readFileSync(path.join(ketchupDir, '.claude.hooks.json'), 'utf-8'));
      expect(content.autoContinue.mode).toBe('non-stop');
    });

    it('updates timestamp on write', () => {
      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      hookState.write(state);

      const content = JSON.parse(fs.readFileSync(path.join(ketchupDir, '.claude.hooks.json'), 'utf-8'));
      expect(content.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('update', () => {
    it('updates specific fields and preserves others', () => {
      const hookState = createHookState(ketchupDir);

      hookState.update({ validateCommit: { mode: 'off' } }, 'test');

      const state = hookState.read();
      expect(state.validateCommit.mode).toBe('off');
      expect(state.autoContinue.mode).toBe('smart');
      expect(state.updatedBy).toBe('test');
    });

    it('defaults updatedBy to unknown when not provided', () => {
      const hookState = createHookState(ketchupDir);

      hookState.update({ validateCommit: { mode: 'warn' } });

      const state = hookState.read();
      expect(state.updatedBy).toBe('unknown');
    });
  });

  describe('incrementIteration', () => {
    it('increments iteration counter', () => {
      const hookState = createHookState(ketchupDir);

      const count = hookState.incrementIteration();

      expect(count).toBe(1);
      expect(hookState.read().autoContinue.iteration).toBe(1);
    });

    it('increments from existing value', () => {
      const existingState = {
        autoContinue: { mode: 'non-stop', iteration: 5 },
      };
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(ketchupDir);
      const count = hookState.incrementIteration();

      expect(count).toBe(6);
    });
  });

  describe('resetIteration', () => {
    it('resets iteration to zero', () => {
      const existingState = {
        autoContinue: { mode: 'non-stop', iteration: 10 },
      };
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(ketchupDir);
      hookState.resetIteration();

      expect(hookState.read().autoContinue.iteration).toBe(0);
    });
  });

  describe('DEFAULT_HOOK_STATE', () => {
    it('has expected default values', () => {
      expect(DEFAULT_HOOK_STATE).toEqual({
        autoContinue: { mode: 'smart', maxIterations: 0, iteration: expect.any(Number), skipModes: ['plan'] },
        validateCommit: { mode: 'strict', batchCount: 3 },
        denyList: { enabled: true, extraPatterns: [] },
        promptReminder: { enabled: true },
        subagentHooks: { validateCommitOnExplore: false, validateCommitOnWork: true, validateCommitOnUnknown: true },
        updatedAt: expect.any(String),
        updatedBy: 'default',
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
      fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), JSON.stringify(existingState));

      const hookState = createHookState(ketchupDir);
      const state = hookState.read();

      expect(state.subagentHooks.validateCommitOnExplore).toBe(true);
      expect(state.subagentHooks.validateCommitOnWork).toBe(false);
      expect(state.subagentHooks.validateCommitOnUnknown).toBe(false);
    });

    it('updates subagentHooks with update method', () => {
      const hookState = createHookState(ketchupDir);

      hookState.update(
        {
          subagentHooks: { validateCommitOnExplore: true, validateCommitOnWork: true, validateCommitOnUnknown: true },
        },
        'test',
      );

      const state = hookState.read();
      expect(state.subagentHooks.validateCommitOnExplore).toBe(true);
    });
  });
});
