import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  addReminder,
  listReminders,
  listValidators,
  removeOverride,
  setConfigValue,
  setReminderPriority,
  showConfig,
  toggleReminder,
  toggleValidator,
} from './config-manager.js';
import { createHookState } from './hook-state.js';
import type { ResolvedPaths } from './path-resolver.js';

describe('config-manager', () => {
  let tempDir: string;
  let autoDir: string;
  let validatorsDir: string;
  let remindersDir: string;
  let paths: ResolvedPaths;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-config-'));
    autoDir = path.join(tempDir, '.claude-auto');
    validatorsDir = path.join(tempDir, 'validators');
    remindersDir = path.join(tempDir, 'reminders');
    const projectRemindersDir = path.join(autoDir, 'reminders');

    fs.mkdirSync(autoDir, { recursive: true });
    fs.mkdirSync(validatorsDir, { recursive: true });
    fs.mkdirSync(remindersDir, { recursive: true });

    paths = {
      projectRoot: tempDir,
      claudeDir: path.join(tempDir, '.claude'),
      autoDir,
      validatorsDirs: [validatorsDir],
      remindersDirs: [remindersDir, projectRemindersDir],
    };

    fs.writeFileSync(
      path.join(validatorsDir, 'test-validator.md'),
      `---
name: test-validator
description: A test validator
enabled: true
---
Validate things.`,
    );

    fs.writeFileSync(
      path.join(validatorsDir, 'disabled-validator.md'),
      `---
name: disabled-validator
description: A disabled validator
enabled: false
---
Disabled.`,
    );

    fs.writeFileSync(
      path.join(remindersDir, 'test-reminder.md'),
      `---
when:
  hook: SessionStart
priority: 50
---
Remember things.`,
    );

    fs.writeFileSync(
      path.join(remindersDir, 'low-priority.md'),
      `---
when:
  hook: SessionStart
priority: 10
---
Low priority.`,
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('showConfig', () => {
    it('returns state, validators, and reminders', () => {
      const result = showConfig(paths);

      expect(result.state.autoContinue.mode).toBe('smart');
      expect(result.validators).toHaveLength(2);
      expect(result.reminders).toHaveLength(2);
    });
  });

  describe('setConfigValue', () => {
    it('sets a nested config value', () => {
      const state = setConfigValue(paths, 'autoContinue.mode', 'off');
      expect(state.autoContinue.mode).toBe('off');
    });

    it('sets boolean values', () => {
      const state = setConfigValue(paths, 'denyList.enabled', 'false');
      expect(state.denyList.enabled).toBe(false);
    });

    it('sets numeric values', () => {
      const state = setConfigValue(paths, 'validateCommit.batchCount', '5');
      expect(state.validateCommit.batchCount).toBe(5);
    });

    it('persists changes to disk', () => {
      setConfigValue(paths, 'autoContinue.mode', 'non-stop');
      const reread = createHookState(autoDir).read();
      expect(reread.autoContinue.mode).toBe('non-stop');
    });

    it('sets JSON array values', () => {
      const state = setConfigValue(paths, 'autoContinue.skipModes', '["plan","code"]');
      expect(state.autoContinue.skipModes).toEqual(['plan', 'code']);
    });

    it('falls back to string for invalid JSON', () => {
      const state = setConfigValue(paths, 'promptReminder.customReminder', '{invalid');
      expect(state.promptReminder.customReminder).toBe('{invalid');
    });

    it('creates intermediate objects for deep paths', () => {
      const state = setConfigValue(paths, 'overrides.validators.foo.enabled', 'true');
      expect((state.overrides.validators as Record<string, unknown>).foo).toEqual({ enabled: true });
    });
  });

  describe('listValidators', () => {
    it('lists all validators with enabled status', () => {
      const result = listValidators(paths);

      expect(result).toHaveLength(2);
      const enabled = result.find((v) => v.name === 'test-validator');
      const disabled = result.find((v) => v.name === 'disabled-validator');
      expect(enabled?.enabled).toBe(true);
      expect(disabled?.enabled).toBe(false);
    });

    it('reflects overrides', () => {
      toggleValidator(paths, 'disabled-validator', true);

      const result = listValidators(paths);
      const validator = result.find((v) => v.name === 'disabled-validator');
      expect(validator?.enabled).toBe(true);
      expect(validator?.overridden).toBe(true);
    });

    it('reads overrides from state when not passed', () => {
      toggleValidator(paths, 'test-validator', false);

      const result = listValidators(paths);
      const validator = result.find((v) => v.name === 'test-validator');
      expect(validator?.enabled).toBe(false);
    });

    it('skips non-existent validator dirs', () => {
      const pathsWithMissing = { ...paths, validatorsDirs: [path.join(tempDir, 'nonexistent')] };
      const result = listValidators(pathsWithMissing);
      expect(result).toEqual([]);
    });

    it('skips non-md files', () => {
      fs.writeFileSync(path.join(validatorsDir, 'notes.txt'), 'not a validator');
      const result = listValidators(paths);
      expect(result.every((v) => v.name !== 'notes')).toBe(true);
    });

    it('deduplicates validators across directories', () => {
      const dir2 = path.join(tempDir, 'validators2');
      fs.mkdirSync(dir2);
      fs.writeFileSync(
        path.join(dir2, 'test-validator.md'),
        `---
name: test-validator
description: Duplicate
enabled: true
---
Duplicate content`,
      );

      const pathsWithTwo = { ...paths, validatorsDirs: [validatorsDir, dir2] };
      const result = listValidators(pathsWithTwo);
      const matches = result.filter((v) => v.name === 'test-validator');
      expect(matches).toHaveLength(1);
    });
  });

  describe('toggleValidator', () => {
    it('disables an enabled validator via override', () => {
      toggleValidator(paths, 'test-validator', false);

      const state = createHookState(autoDir).read();
      expect(state.overrides.validators['test-validator']).toEqual({ enabled: false });
    });

    it('enables a disabled validator via override', () => {
      toggleValidator(paths, 'disabled-validator', true);

      const state = createHookState(autoDir).read();
      expect(state.overrides.validators['disabled-validator']).toEqual({ enabled: true });
    });
  });

  describe('listReminders', () => {
    it('lists all reminders with status', () => {
      const result = listReminders(paths);

      expect(result).toHaveLength(2);
      const reminder = result.find((r) => r.name === 'test-reminder');
      expect(reminder?.priority).toBe(50);
      expect(reminder?.hook).toBe('SessionStart');
      expect(reminder?.enabled).toBe(true);
    });

    it('reflects priority overrides', () => {
      setReminderPriority(paths, 'test-reminder', 200);

      const result = listReminders(paths);
      const reminder = result.find((r) => r.name === 'test-reminder');
      expect(reminder?.priority).toBe(200);
      expect(reminder?.overridden).toBe(true);
    });

    it('reads overrides from state when not passed', () => {
      toggleReminder(paths, 'test-reminder', false);

      const result = listReminders(paths);
      const reminder = result.find((r) => r.name === 'test-reminder');
      expect(reminder?.enabled).toBe(false);
    });

    it('deduplicates reminders across directories', () => {
      const projectRemindersDir = path.join(autoDir, 'reminders');
      fs.mkdirSync(projectRemindersDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectRemindersDir, 'test-reminder.md'),
        `---
when:
  hook: SessionStart
priority: 999
---
Duplicate`,
      );

      const result = listReminders(paths);
      const matches = result.filter((r) => r.name === 'test-reminder');
      expect(matches).toHaveLength(1);
    });

    it('shows (all) for reminders without a hook filter', () => {
      fs.writeFileSync(
        path.join(remindersDir, 'no-hook.md'),
        `---
priority: 5
---
No hook filter`,
      );

      const result = listReminders(paths);
      const reminder = result.find((r) => r.name === 'no-hook');
      expect(reminder?.hook).toBe('(all)');
    });
  });

  describe('toggleReminder', () => {
    it('disables a reminder via override', () => {
      toggleReminder(paths, 'test-reminder', false);

      const state = createHookState(autoDir).read();
      expect(state.overrides.reminders['test-reminder']?.enabled).toBe(false);
    });
  });

  describe('setReminderPriority', () => {
    it('sets priority override for a reminder', () => {
      setReminderPriority(paths, 'low-priority', 999);

      const state = createHookState(autoDir).read();
      expect(state.overrides.reminders['low-priority']?.priority).toBe(999);
    });
  });

  describe('addReminder', () => {
    it('creates a new reminder markdown file in project reminders dir', () => {
      const filePath = addReminder(paths, 'my-custom', {
        hook: 'UserPromptSubmit',
        priority: 75,
        content: 'Always check tests.',
      });

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('hook: UserPromptSubmit');
      expect(content).toContain('priority: 75');
      expect(content).toContain('Always check tests.');
    });

    it('creates reminder without optional fields', () => {
      const filePath = addReminder(paths, 'simple', {
        content: 'Just a reminder.',
      });

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toBe('Just a reminder.\n');
    });
  });

  describe('removeOverride', () => {
    it('removes a validator override', () => {
      toggleValidator(paths, 'test-validator', false);
      removeOverride(paths, 'validators', 'test-validator');

      const state = createHookState(autoDir).read();
      expect(state.overrides.validators['test-validator']).toBeUndefined();
    });

    it('removes a reminder override', () => {
      toggleReminder(paths, 'test-reminder', false);
      removeOverride(paths, 'reminders', 'test-reminder');

      const state = createHookState(autoDir).read();
      expect(state.overrides.reminders['test-reminder']).toBeUndefined();
    });
  });
});
