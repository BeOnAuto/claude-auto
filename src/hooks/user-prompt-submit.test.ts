import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from '../config-loader.js';
import { handleUserPromptSubmit } from './user-prompt-submit.js';

describe('user-prompt-submit hook', () => {
  let tempDir: string;
  let claudeDir: string;
  let ketchupDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-prompt-'));
    claudeDir = path.join(tempDir, '.claude');
    ketchupDir = path.join(tempDir, DEFAULT_KETCHUP_DIR);
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(ketchupDir, { recursive: true });
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
    const remindersDir = path.join(ketchupDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    const result = await handleUserPromptSubmit(claudeDir, 'session-1', 'Help me fix this bug');

    expect(result).toEqual({
      result: 'Help me fix this bug\n\n<system-reminder>\nRemember to follow coding standards.\n</system-reminder>',
    });
  });

  it('returns prompt unchanged when no reminders exist', async () => {
    const result = await handleUserPromptSubmit(claudeDir, 'session-2', 'Help me fix this bug');

    expect(result).toEqual({ result: 'Help me fix this bug' });
  });

  it('logs to activity.log with session ID', async () => {
    const remindersDir = path.join(ketchupDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    await handleUserPromptSubmit(claudeDir, 'my-session-id', 'Help me fix this bug');

    const logPath = path.join(claudeDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[ssion-id]');
    expect(content).toContain('user-prompt-submit:');
  });

  it('logs reminders injected when DEBUG=ketchup', async () => {
    process.env.DEBUG = 'ketchup';
    const remindersDir = path.join(ketchupDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'coding-standards.md'),
      `---
when:
  hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    await handleUserPromptSubmit(claudeDir, 'debug-session', 'Help me fix this bug');

    const logPath = path.join(claudeDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[user-prompt-submit]');
    expect(content).toContain('injected 1 reminder');
  });
});
