import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_AUTO_DIR } from '../config-loader.js';
import { handleSessionStart } from './session-start.js';

describe('session-start hook', () => {
  let tempDir: string;
  let claudeDir: string;
  let autoDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-session-'));
    claudeDir = path.join(tempDir, '.claude');
    autoDir = path.join(tempDir, DEFAULT_AUTO_DIR);
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('outputs filtered reminders content for SessionStart hook', async () => {
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'my-reminder.md'),
      `---
when:
  hook: SessionStart
priority: 10
---

# My Reminder

This is the reminder content.`,
    );

    const result = await handleSessionStart(claudeDir, 'test-session-id');

    expect(result.hookSpecificOutput).toEqual({
      hookEventName: 'SessionStart',
      additionalContext: '# My Reminder\n\nThis is the reminder content.',
    });
    expect(result.diagnostics.reminderFiles).toEqual(['my-reminder.md']);
    expect(result.diagnostics.matchedReminders).toEqual([{ name: 'my-reminder', priority: 10 }]);
  });

  it('logs to activity.log with session ID', async () => {
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'reminder.md'),
      `---
when:
  hook: SessionStart
---

Content.`,
    );

    await handleSessionStart(claudeDir, 'abc12345-session');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[-session]');
    expect(content).toContain('session-start:');
  });

  it('logs reminders loaded when DEBUG=claude-auto', async () => {
    process.env.DEBUG = 'claude-auto';
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'reminder-a.md'),
      `---
when:
  hook: SessionStart
priority: 10
---

Reminder A content.`,
    );
    fs.writeFileSync(
      path.join(remindersDir, 'reminder-b.md'),
      `---
when:
  hook: PreToolUse
---

Reminder B content.`,
    );

    await handleSessionStart(claudeDir, 'debug-session');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[session-start]');
    expect(content).toContain('loaded 1 reminders for SessionStart');
  });
});
