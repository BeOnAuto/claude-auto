import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handlePreToolUse } from './pre-tool-use.js';

describe('pre-tool-use hook', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-pretool-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('blocks tool use when path matches deny pattern', () => {
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.secret' };

    const result = handlePreToolUse(tempDir, 'session-1', toolInput);

    expect(result).toEqual({
      decision: 'block',
      reason: 'Path /project/config.secret is denied by ketchup deny-list',
    });
  });

  it('allows tool use when path does not match deny pattern', () => {
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.json' };

    const result = handlePreToolUse(tempDir, 'session-2', toolInput);

    expect(result).toEqual({ decision: 'allow' });
  });

  it('logs to activity.log with session ID', () => {
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.secret' };

    handlePreToolUse(tempDir, 'my-session-id', toolInput);

    const logPath = path.join(tempDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[ssion-id]');
    expect(content).toContain('pre-tool-use:');
  });

  it('logs deny-list check when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.secret' };

    handlePreToolUse(tempDir, 'debug-session', toolInput);

    const logPath = path.join(tempDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[pre-tool-use]');
    expect(content).toContain('/project/config.secret');
    expect(content).toContain('blocked');
  });

  it('routes Bash git commit to validator and blocks on NACK', () => {
    const validatorsDir = path.join(tempDir, 'validators');
    fs.mkdirSync(validatorsDir);
    fs.writeFileSync(
      path.join(validatorsDir, 'test.md'),
      `---
name: test-validator
description: Test
enabled: true
---
Validate this commit`
    );

    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Missing tests"}',
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = handlePreToolUse(tempDir, 'session-3', toolInput, { executor });

    expect(result).toEqual({
      decision: 'block',
      reason: 'test-validator: Missing tests',
    });
  });

  it('allows git commit when all validators ACK', () => {
    const validatorsDir = path.join(tempDir, 'validators');
    fs.mkdirSync(validatorsDir);
    fs.writeFileSync(
      path.join(validatorsDir, 'test.md'),
      `---
name: test-validator
description: Test
enabled: true
---
Validate this commit`
    );

    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = handlePreToolUse(tempDir, 'session-4', toolInput, { executor });

    expect(result).toEqual({ decision: 'allow' });
  });

  it('injects reminders matching PreToolUse hook and toolName', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'bash-reminder.md'),
      `---
when:
  hook: PreToolUse
  toolName: Bash
priority: 10
---

Remember: test && commit || revert`
    );
    fs.writeFileSync(
      path.join(remindersDir, 'edit-reminder.md'),
      `---
when:
  hook: PreToolUse
  toolName: Edit
---

Check for typos.`
    );

    const toolInput = { command: 'echo hello' };
    const result = handlePreToolUse(tempDir, 'session-5', toolInput, { toolName: 'Bash' });

    expect(result).toEqual({
      decision: 'allow',
      result: 'Remember: test && commit || revert',
    });
  });
});
