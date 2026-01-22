import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleSessionStart } from './session-start.js';

describe('session-start hook', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-session-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('outputs filtered reminders content for SessionStart hook', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'my-reminder.md'),
      `---
when:
  hook: SessionStart
priority: 10
---

# My Reminder

This is the reminder content.`
    );

    const result = handleSessionStart(tempDir, 'test-session-id');

    expect(result).toEqual({
      result: '# My Reminder\n\nThis is the reminder content.',
    });
  });

  it('logs to activity.log with session ID', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'reminder.md'),
      `---
when:
  hook: SessionStart
---

Content.`
    );

    handleSessionStart(tempDir, 'abc12345-session');

    const logPath = path.join(tempDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[-session]');
    expect(content).toContain('session-start:');
  });

  it('logs reminders loaded when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'reminder-a.md'),
      `---
when:
  hook: SessionStart
priority: 10
---

Reminder A content.`
    );
    fs.writeFileSync(
      path.join(remindersDir, 'reminder-b.md'),
      `---
when:
  hook: PreToolUse
---

Reminder B content.`
    );

    handleSessionStart(tempDir, 'debug-session');

    const logPath = path.join(tempDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[session-start]');
    expect(content).toContain('loaded 1 reminders for SessionStart');
  });
});
