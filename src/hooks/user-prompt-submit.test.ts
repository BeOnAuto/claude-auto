import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleUserPromptSubmit } from './user-prompt-submit.js';

describe('user-prompt-submit hook', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-prompt-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('injects reminder skills into user prompt', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'reminder.md'),
      `---
hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    const result = handleUserPromptSubmit(tempDir, 'Help me fix this bug');

    expect(result).toEqual({
      result: 'Help me fix this bug\n\n<system-reminder>\nRemember to follow coding standards.\n</system-reminder>',
    });
  });

  it('returns prompt unchanged when no reminder skills exist', () => {
    const result = handleUserPromptSubmit(tempDir, 'Help me fix this bug');

    expect(result).toEqual({ result: 'Help me fix this bug' });
  });

  it('logs reminders injected when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'reminder.md'),
      `---
hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    handleUserPromptSubmit(tempDir, 'Help me fix this bug');

    const logPath = path.join(tempDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[user-prompt-submit]');
    expect(content).toContain('injected 1 reminder');
  });
});
