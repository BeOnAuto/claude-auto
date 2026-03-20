import * as fs from 'node:fs';
import * as path from 'node:path';

import type { HookState, OverridesState } from './hook-state.js';
import { createHookState } from './hook-state.js';
import type { ResolvedPaths } from './path-resolver.js';
import { parseReminder, scanReminders } from './reminder-loader.js';
import { loadAllValidatorMeta } from './validator-loader.js';

export interface ValidatorStatus {
  name: string;
  description: string;
  enabled: boolean;
  source: string;
  overridden: boolean;
}

export interface ReminderStatus {
  name: string;
  hook: string;
  priority: number;
  enabled: boolean;
  source: string;
  overridden: boolean;
}

export interface ConfigShowResult {
  state: HookState;
  validators: ValidatorStatus[];
  reminders: ReminderStatus[];
}

export function showConfig(paths: ResolvedPaths): ConfigShowResult {
  const state = createHookState(paths.autoDir).read();
  const validators = listValidators(paths, state.overrides);
  const reminders = listReminders(paths, state.overrides);
  return { state, validators, reminders };
}

export function setConfigValue(paths: ResolvedPaths, keyPath: string, value: string): HookState {
  const hookState = createHookState(paths.autoDir);
  const state = hookState.read();

  const parsed = parseValue(value);
  setNestedValue(state as unknown as Record<string, unknown>, keyPath, parsed);
  hookState.write(state);
  return state;
}

export function listValidators(paths: ResolvedPaths, overrides?: OverridesState): ValidatorStatus[] {
  const state = overrides ?? createHookState(paths.autoDir).read().overrides;
  const statuses: ValidatorStatus[] = [];
  const seen = new Set<string>();

  for (const dir of paths.validatorsDirs) {
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;

      const meta = loadAllValidatorMeta(path.join(dir, file));
      if (seen.has(meta.name)) continue;
      seen.add(meta.name);

      const override = state.validators[meta.name];
      const enabled = override !== undefined ? override.enabled : meta.enabled !== false;

      statuses.push({
        name: meta.name,
        description: meta.description,
        enabled,
        source: dir,
        overridden: override !== undefined,
      });
    }
  }

  return statuses;
}

export function listReminders(paths: ResolvedPaths, overrides?: OverridesState): ReminderStatus[] {
  const state = overrides ?? createHookState(paths.autoDir).read().overrides;
  const statuses: ReminderStatus[] = [];
  const seen = new Set<string>();

  for (const dir of paths.remindersDirs) {
    const filenames = scanReminders(dir);
    for (const filename of filenames) {
      if (seen.has(filename)) continue;
      seen.add(filename);

      const content = fs.readFileSync(path.join(dir, filename), 'utf8');
      const reminder = parseReminder(content, filename);
      const override = state.reminders[reminder.name];
      const enabled = override?.enabled !== false;
      const priority = override?.priority ?? reminder.priority;

      statuses.push({
        name: reminder.name,
        hook: (reminder.when.hook as string) || '(all)',
        priority,
        enabled,
        source: dir,
        overridden: override !== undefined,
      });
    }
  }

  return statuses;
}

export function toggleValidator(paths: ResolvedPaths, name: string, enabled: boolean): OverridesState {
  const hookState = createHookState(paths.autoDir);
  const state = hookState.read();
  state.overrides.validators[name] = { enabled };
  hookState.write(state);
  return state.overrides;
}

export function toggleReminder(paths: ResolvedPaths, name: string, enabled: boolean): OverridesState {
  const hookState = createHookState(paths.autoDir);
  const state = hookState.read();
  if (!state.overrides.reminders[name]) {
    state.overrides.reminders[name] = {};
  }
  state.overrides.reminders[name].enabled = enabled;
  hookState.write(state);
  return state.overrides;
}

export function setReminderPriority(paths: ResolvedPaths, name: string, priority: number): OverridesState {
  const hookState = createHookState(paths.autoDir);
  const state = hookState.read();
  if (!state.overrides.reminders[name]) {
    state.overrides.reminders[name] = {};
  }
  state.overrides.reminders[name].priority = priority;
  hookState.write(state);
  return state.overrides;
}

export function addReminder(
  paths: ResolvedPaths,
  name: string,
  options: { hook?: string; priority?: number; content: string },
): string {
  const projectRemindersDir = paths.remindersDirs[paths.remindersDirs.length - 1];
  if (!fs.existsSync(projectRemindersDir)) {
    fs.mkdirSync(projectRemindersDir, { recursive: true });
  }

  const frontmatter: Record<string, unknown> = {};
  if (options.hook) {
    frontmatter.when = { hook: options.hook };
  }
  if (options.priority !== undefined) {
    frontmatter.priority = options.priority;
  }

  const yaml = Object.keys(frontmatter).length > 0 ? `---\n${formatYaml(frontmatter)}---\n\n` : '';

  const filePath = path.join(projectRemindersDir, `${name}.md`);
  fs.writeFileSync(filePath, `${yaml}${options.content}\n`);
  return filePath;
}

export function removeOverride(paths: ResolvedPaths, type: 'validators' | 'reminders', name: string): OverridesState {
  const hookState = createHookState(paths.autoDir);
  const state = hookState.read();
  delete state.overrides[type][name];
  hookState.write(state);
  return state.overrides;
}

function parseValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: unknown): void {
  const keys = keyPath.split('.');
  let current = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

function formatYaml(obj: Record<string, unknown>, indent = 0): string {
  let result = '';
  const prefix = '  '.repeat(indent);
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      result += `${prefix}${key}:\n${formatYaml(val as Record<string, unknown>, indent + 1)}`;
    } else {
      result += `${prefix}${key}: ${val}\n`;
    }
  }
  return result;
}
