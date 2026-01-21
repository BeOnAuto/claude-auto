import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseReminder, scanReminders } from './reminder-loader.js';

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
