import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadReminders, matchReminders, parseReminder, scanReminders, sortByPriority } from './reminder-loader.js';
import type { Reminder, ReminderContext } from './reminder-loader.js';

describe('scanReminders', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-reminder-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when reminders directory does not exist', () => {
    const result = scanReminders(tempDir);

    expect(result).toEqual([]);
  });

  it('returns .md file names from reminders directory', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir);
    fs.writeFileSync(path.join(remindersDir, 'ketchup.md'), '# Test');
    fs.writeFileSync(path.join(remindersDir, 'plan-mode.md'), '# Plan');
    fs.writeFileSync(path.join(remindersDir, 'ignore.txt'), 'not a reminder');

    const result = scanReminders(tempDir);

    expect(result).toEqual(['ketchup.md', 'plan-mode.md']);
  });
});

describe('parseReminder', () => {
  it('parses YAML frontmatter with when conditions and priority', () => {
    const content = `---
when:
  hook: SessionStart
  mode: plan
priority: 100
---

Ask clarifying questions until crystal clear.`;

    const result = parseReminder(content, 'plan-mode.md');

    expect(result).toEqual({
      name: 'plan-mode',
      when: { hook: 'SessionStart', mode: 'plan' },
      priority: 100,
      content: 'Ask clarifying questions until crystal clear.',
    });
  });

  it('returns empty when and default priority when no frontmatter', () => {
    const content = `# Simple Reminder

Just some content without frontmatter.`;

    const result = parseReminder(content, 'simple.md');

    expect(result).toEqual({
      name: 'simple',
      when: {},
      priority: 0,
      content: '# Simple Reminder\n\nJust some content without frontmatter.',
    });
  });
});

describe('matchReminders', () => {
  it('filters reminders by context with implicit AND on all when conditions', () => {
    const reminders: Reminder[] = [
      { name: 'always', when: {}, priority: 0, content: 'Always shown' },
      { name: 'session-only', when: { hook: 'SessionStart' }, priority: 0, content: 'Session' },
      { name: 'plan-mode', when: { mode: 'plan' }, priority: 0, content: 'Plan' },
      { name: 'session-plan', when: { hook: 'SessionStart', mode: 'plan' }, priority: 0, content: 'Both' },
      { name: 'bash-tool', when: { hook: 'PreToolUse', toolName: 'Bash' }, priority: 0, content: 'Bash' },
      { name: 'custom-key', when: { customFlag: true }, priority: 0, content: 'Custom' },
    ];

    const context: ReminderContext = { hook: 'SessionStart', mode: 'plan' };
    const result = matchReminders(reminders, context);

    expect(result.map((r) => r.name)).toEqual(['always', 'session-only', 'plan-mode', 'session-plan']);
  });
});

describe('sortByPriority', () => {
  it('sorts reminders by priority descending with default 0', () => {
    const reminders: Reminder[] = [
      { name: 'low', when: {}, priority: 10, content: 'Low' },
      { name: 'default', when: {}, priority: 0, content: 'Default' },
      { name: 'high', when: {}, priority: 100, content: 'High' },
      { name: 'medium', when: {}, priority: 50, content: 'Medium' },
    ];

    const result = sortByPriority(reminders);

    expect(result.map((r: Reminder) => r.name)).toEqual(['high', 'medium', 'low', 'default']);
  });
});

describe('loadReminders', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-reminder-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('scans, parses, matches, and sorts reminders from directory', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir);

    fs.writeFileSync(
      path.join(remindersDir, 'always.md'),
      `---
priority: 10
---
Always shown`
    );
    fs.writeFileSync(
      path.join(remindersDir, 'high-priority.md'),
      `---
priority: 100
---
High priority`
    );
    fs.writeFileSync(
      path.join(remindersDir, 'session-only.md'),
      `---
when:
  hook: PreToolUse
priority: 50
---
Session only`
    );

    const context: ReminderContext = { hook: 'SessionStart' };
    const result = loadReminders(tempDir, context);

    expect(result.map((r) => r.name)).toEqual(['high-priority', 'always']);
  });
});
