import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from '../config-loader.js';
import { handlePreToolUse } from './pre-tool-use.js';

describe('pre-tool-use hook', () => {
  let tempDir: string;
  let claudeDir: string;
  let ketchupDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-pretool-'));
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

  it('blocks tool use when path matches deny pattern', async () => {
    fs.writeFileSync(path.join(claudeDir, 'deny-list.project.txt'), '*.secret\n');
    const toolInput = { file_path: '/project/config.secret' };

    const result = await handlePreToolUse(claudeDir, 'session-1', toolInput);

    expect(result).toEqual({
      decision: 'block',
      reason: 'Path /project/config.secret is denied by ketchup deny-list',
    });
  });

  it('allows tool use when path does not match deny pattern', async () => {
    fs.writeFileSync(path.join(claudeDir, 'deny-list.project.txt'), '*.secret\n');
    const toolInput = { file_path: '/project/config.json' };

    const result = await handlePreToolUse(claudeDir, 'session-2', toolInput);

    expect(result).toEqual({ decision: 'allow' });
  });

  it('logs to activity.log with session ID', async () => {
    fs.writeFileSync(path.join(claudeDir, 'deny-list.project.txt'), '*.secret\n');
    const toolInput = { file_path: '/project/config.secret' };

    await handlePreToolUse(claudeDir, 'my-session-id', toolInput);

    const logPath = path.join(claudeDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[ssion-id]');
    expect(content).toContain('pre-tool-use:');
  });

  it('logs deny-list check when DEBUG=ketchup', async () => {
    process.env.DEBUG = 'ketchup';
    fs.writeFileSync(path.join(claudeDir, 'deny-list.project.txt'), '*.secret\n');
    const toolInput = { file_path: '/project/config.secret' };

    await handlePreToolUse(claudeDir, 'debug-session', toolInput);

    const logPath = path.join(claudeDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[pre-tool-use]');
    expect(content).toContain('/project/config.secret');
    expect(content).toContain('blocked');
  });

  it('routes Bash git commit to validator and blocks on NACK', async () => {
    const validatorsDir = path.join(ketchupDir, 'validators');
    fs.mkdirSync(validatorsDir);
    fs.writeFileSync(
      path.join(validatorsDir, 'test.md'),
      `---
name: test-validator
description: Test
enabled: true
---
Validate this commit`,
    );

    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Missing tests"}',
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = await handlePreToolUse(claudeDir, 'session-3', toolInput, { executor });

    expect(result).toEqual({
      decision: 'block',
      reason: 'test-validator: Missing tests',
    });
  });

  it('allows git commit when all validators ACK', async () => {
    const validatorsDir = path.join(ketchupDir, 'validators');
    fs.mkdirSync(validatorsDir);
    fs.writeFileSync(
      path.join(validatorsDir, 'test.md'),
      `---
name: test-validator
description: Test
enabled: true
---
Validate this commit`,
    );

    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = await handlePreToolUse(claudeDir, 'session-4', toolInput, { executor });

    expect(result).toEqual({ decision: 'allow' });
  });

  it('injects reminders matching PreToolUse hook and toolName', async () => {
    const remindersDir = path.join(ketchupDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'bash-reminder.md'),
      `---
when:
  hook: PreToolUse
  toolName: Bash
priority: 10
---

Remember: test && commit || revert`,
    );
    fs.writeFileSync(
      path.join(remindersDir, 'edit-reminder.md'),
      `---
when:
  hook: PreToolUse
  toolName: Edit
---

Check for typos.`,
    );

    const toolInput = { command: 'echo hello' };
    const result = await handlePreToolUse(claudeDir, 'session-5', toolInput, { toolName: 'Bash' });

    expect(result).toEqual({
      decision: 'allow',
      result: 'Remember: test && commit || revert',
    });
  });
});
