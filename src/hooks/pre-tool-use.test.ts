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

  it('does not write to activity.log for non-commit non-blocked tool use', async () => {
    const toolInput = { command: 'echo hello' };

    await handlePreToolUse(claudeDir, 'session-silent', toolInput);

    const logPath = path.join(ketchupDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it('logs to activity.log with session ID', async () => {
    fs.writeFileSync(path.join(claudeDir, 'deny-list.project.txt'), '*.secret\n');
    const toolInput = { file_path: '/project/config.secret' };

    await handlePreToolUse(claudeDir, 'my-session-id', toolInput);

    const logPath = path.join(ketchupDir, 'logs', 'activity.log');
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

    const logPath = path.join(ketchupDir, 'logs', 'ketchup', 'debug.log');
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
      stdout: JSON.stringify({
        type: 'result',
        subtype: 'success',
        result: '{"decision":"NACK","reason":"Missing tests"}',
      }),
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
      stdout: JSON.stringify({ type: 'result', subtype: 'success', result: '{"decision":"ACK"}' }),
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = await handlePreToolUse(claudeDir, 'session-4', toolInput, { executor });

    expect(result).toEqual({ decision: 'allow' });
  });

  it('excludes appeal-system from regular validator run', async () => {
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
    fs.writeFileSync(
      path.join(validatorsDir, 'appeal-system.md'),
      `---
name: appeal-system
description: Evaluates appeals
enabled: true
---
You are the appeal system.`,
    );

    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ type: 'result', subtype: 'success', result: '{"decision":"ACK"}' }),
    });

    const toolInput = {
      command: 'git commit -m "Test commit"',
    };

    const result = await handlePreToolUse(claudeDir, 'session-appeal-exclude', toolInput, { executor });

    expect(result).toEqual({ decision: 'allow' });
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it('validates commit when command uses cd into a sub-repo and hook cwd differs', async () => {
    // Previously the hook crashed because process.cwd() pointed to a
    // non-repo parent while the command did "cd /sub-repo && git commit".
    // Now getCommitContext extracts the cd target and uses it as the git cwd.
    const { execSync } = require('node:child_process');
    const repoDir = path.join(tempDir, 'sub-repo');
    fs.mkdirSync(repoDir);
    execSync('git init', { cwd: repoDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: repoDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: repoDir, stdio: 'pipe' });
    fs.writeFileSync(path.join(repoDir, 'file.ts'), 'const x = 1;');
    execSync('git add file.ts', { cwd: repoDir, stdio: 'pipe' });

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
      stdout: JSON.stringify({
        type: 'result',
        subtype: 'success',
        result: '{"decision":"NACK","reason":"Missing tests"}',
      }),
    });

    const toolInput = {
      command: `cd ${repoDir} && git add file.ts && git commit -m "test: no-op"`,
    };

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);

    try {
      const result = await handlePreToolUse(claudeDir, 'session-cd-fix', toolInput, { executor });

      expect(result).toEqual({
        decision: 'block',
        reason: 'test-validator: Missing tests',
      });
    } finally {
      cwdSpy.mockRestore();
    }
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
