import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_AUTO_DIR } from '../config-loader.js';
import { handleUserPromptSubmit } from './user-prompt-submit.js';

describe('user-prompt-submit hook', () => {
  let tempDir: string;
  let claudeDir: string;
  let autoDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-prompt-'));
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

  it('injects reminders into user prompt', async () => {
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`,
    );

    const result = await handleUserPromptSubmit(claudeDir, 'session-1', 'Help me fix this bug');

    expect(result.result).toBe(
      'Help me fix this bug\n\n<system-reminder>\nRemember to follow coding standards.\n</system-reminder>',
    );
    expect(result.diagnostics.matchedReminders).toEqual([{ name: 'coding-standards', priority: 10 }]);
  });

  it('returns prompt unchanged when no reminders exist', async () => {
    const result = await handleUserPromptSubmit(claudeDir, 'session-2', 'Help me fix this bug');

    expect(result.result).toBe('Help me fix this bug');
    expect(result.diagnostics.matchedReminders).toEqual([]);
  });

  it('logs to activity.log with session ID', async () => {
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`,
    );

    await handleUserPromptSubmit(claudeDir, 'my-session-id', 'Help me fix this bug');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[ssion-id]');
    expect(content).toContain('user-prompt-submit:');
  });

  it('logs reminders injected when DEBUG=claude-auto', async () => {
    process.env.DEBUG = 'claude-auto';
    const remindersDir = path.join(autoDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`,
    );

    await handleUserPromptSubmit(claudeDir, 'debug-session', 'Help me fix this bug');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[user-prompt-submit]');
    expect(content).toContain('injected 1 reminder');
  });
});
