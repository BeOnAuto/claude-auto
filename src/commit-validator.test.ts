import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  extractAppeal,
  formatBlockMessage,
  getCommitContext,
  handleCommitValidation,
  isCommitCommand,
  runAppealValidator,
  runValidator,
  validateCommit,
} from './commit-validator.js';
import type { Validator } from './validator-loader.js';

describe('extractAppeal', () => {
  it('extracts appeal from commit message with [appeal: reason]', () => {
    const message = 'feat: add feature [appeal: coherence]';

    const result = extractAppeal(message);

    expect(result).toBe('coherence');
  });

  it('returns null when no appeal present', () => {
    const message = 'feat: add feature';

    const result = extractAppeal(message);

    expect(result).toBe(null);
  });
});

describe('isCommitCommand', () => {
  it('detects simple git commit', () => {
    expect(isCommitCommand('git commit -m "message"')).toBe(true);
  });

  it('detects git commit with add', () => {
    expect(isCommitCommand('git add -A && git commit -m "message"')).toBe(true);
  });

  it('detects git commit with heredoc', () => {
    expect(isCommitCommand('git commit -m "$(cat <<\'EOF\'\nmessage\nEOF\n)"')).toBe(true);
  });

  it('returns false for git status', () => {
    expect(isCommitCommand('git status')).toBe(false);
  });

  it('returns false for git diff', () => {
    expect(isCommitCommand('git diff')).toBe(false);
  });

  it('returns false for non-git commands', () => {
    expect(isCommitCommand('npm test')).toBe(false);
  });
});

describe('getCommitContext', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-commit-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('extracts diff, files, and message from staged changes', () => {
    const { execSync } = require('node:child_process');
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'hello world');
    execSync('git add test.txt', { cwd: tempDir, stdio: 'pipe' });

    const result = getCommitContext(tempDir, 'git commit -m "Add test file"');

    expect(result).toEqual({
      diff: expect.stringContaining('+hello world'),
      files: ['test.txt'],
      message: 'Add test file',
    });
  });

  it('returns empty message when no -m flag present', () => {
    const { execSync } = require('node:child_process');
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'hello');
    execSync('git add test.txt', { cwd: tempDir, stdio: 'pipe' });

    const result = getCommitContext(tempDir, 'git commit');

    expect(result).toEqual({
      diff: expect.stringContaining('+hello'),
      files: ['test.txt'],
      message: '',
    });
  });
});

describe('runValidator', () => {
  it('calls executor with formatted prompt', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const validator: Validator = {
      name: 'test-validator',
      description: 'Test',
      enabled: true,
      content: 'Check the commit',
      path: '/validators/test.md',
    };
    const context = {
      diff: '+hello world',
      files: ['test.txt'],
      message: 'Add test',
    };

    runValidator(validator, context, executor);

    expect(executor).toHaveBeenCalledWith(
      'claude',
      ['-p', expect.stringContaining('<diff>'), '--output-format', 'json'],
      expect.objectContaining({ encoding: 'utf8' }),
    );
  });

  it('includes validator content in prompt', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const validator: Validator = {
      name: 'test-validator',
      description: 'Test',
      enabled: true,
      content: 'Check that tests pass',
      path: '/validators/test.md',
    };
    const context = {
      diff: '+hello',
      files: ['test.txt'],
      message: 'Test commit',
    };

    runValidator(validator, context, executor);

    const prompt = executor.mock.calls[0][1][1];
    expect(prompt).toContain('Check that tests pass');
    expect(prompt).toContain('<diff>');
    expect(prompt).toContain('+hello');
    expect(prompt).toContain('<commit-message>');
    expect(prompt).toContain('Test commit');
    expect(prompt).toContain('<files>');
    expect(prompt).toContain('test.txt');
  });

  it('parses ACK response', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'ACK' });
  });

  it('parses NACK response with reason', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Missing tests"}',
    });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'NACK', reason: 'Missing tests' });
  });
});

describe('runAppealValidator', () => {
  it('includes validator results and appeal in prompt', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const appealValidator: Validator = {
      name: 'appeal-system',
      description: 'Evaluate appeals',
      enabled: true,
      content: 'Judge the appeal',
      path: '/appeal.md',
    };
    const context = {
      diff: '+hello',
      files: ['test.txt'],
      message: 'feat: add feature [appeal: coherence]',
    };
    const results = [
      { validator: 'coverage-rules', decision: 'NACK' as const, reason: 'Missing tests', appealable: true },
    ];
    const appeal = 'these files are tightly coupled';

    runAppealValidator(appealValidator, context, results, appeal, executor);

    const prompt = executor.mock.calls[0][1][1];
    expect(prompt).toContain('<validator-results>');
    expect(prompt).toContain('coverage-rules: NACK - Missing tests');
    expect(prompt).toContain('<appeal>');
    expect(prompt).toContain('these files are tightly coupled');
    expect(prompt).toContain('Judge the appeal');
  });

  it('returns ACK when appeal is valid', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"ACK"}',
    });

    const appealValidator: Validator = {
      name: 'appeal-system',
      description: 'Evaluate appeals',
      enabled: true,
      content: 'Judge',
      path: '/appeal.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };
    const results = [{ validator: 'v1', decision: 'NACK' as const, reason: 'reason', appealable: true }];

    const result = runAppealValidator(appealValidator, context, results, 'coherence', executor);

    expect(result).toEqual({ decision: 'ACK' });
  });

  it('returns NACK when appeal is invalid', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Appeal does not justify violation"}',
    });

    const appealValidator: Validator = {
      name: 'appeal-system',
      description: 'Evaluate appeals',
      enabled: true,
      content: 'Judge',
      path: '/appeal.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };
    const results = [{ validator: 'v1', decision: 'NACK' as const, reason: 'reason', appealable: true }];

    const result = runAppealValidator(appealValidator, context, results, 'please let me in', executor);

    expect(result).toEqual({ decision: 'NACK', reason: 'Appeal does not justify violation' });
  });
});

describe('validateCommit', () => {
  it('runs validators in parallel and returns results', () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({ status: 0, stdout: '{"decision":"ACK"}' })
      .mockReturnValueOnce({ status: 0, stdout: '{"decision":"ACK"}' });

    const validators: Validator[] = [
      { name: 'v1', description: 'd1', enabled: true, content: 'c1', path: '/v1.md' },
      { name: 'v2', description: 'd2', enabled: true, content: 'c2', path: '/v2.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK', appealable: true },
      { validator: 'v2', decision: 'ACK', appealable: true },
    ]);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('aggregates NACK reasons from multiple validators', () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({ status: 0, stdout: '{"decision":"ACK"}' })
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"NACK","reason":"Missing tests"}',
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"NACK","reason":"No coverage"}',
      });

    const validators: Validator[] = [
      { name: 'v1', description: 'd1', enabled: true, content: 'c1', path: '/v1.md' },
      { name: 'v2', description: 'd2', enabled: true, content: 'c2', path: '/v2.md' },
      { name: 'v3', description: 'd3', enabled: true, content: 'c3', path: '/v3.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK', appealable: true },
      { validator: 'v2', decision: 'NACK', reason: 'Missing tests', appealable: true },
      { validator: 'v3', decision: 'NACK', reason: 'No coverage', appealable: true },
    ]);
  });

  it('marks no-dangerous-git validator as not appealable', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"--force is forbidden"}',
    });

    const validators: Validator[] = [
      { name: 'no-dangerous-git', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'no-dangerous-git', decision: 'NACK', reason: '--force is forbidden', appealable: false },
    ]);
  });
});

describe('handleCommitValidation', () => {
  it('allows commit when all validators ACK', () => {
    const executor = vi.fn().mockReturnValue({ status: 0, stdout: '{"decision":"ACK"}' });
    const validators: Validator[] = [{ name: 'v1', description: 'd', enabled: true, content: 'c', path: '/v.md' }];
    const context = { diff: '+a', files: ['a.txt'], message: 'feat: add feature' };

    const result = handleCommitValidation(validators, context, executor);

    expect(result).toEqual({ allowed: true, results: expect.any(Array) });
  });

  it('blocks commit when validator NACKs without appeal', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Missing tests"}',
    });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'feat: add feature' };

    const result = handleCommitValidation(validators, context, executor);

    expect(result).toEqual({
      allowed: false,
      results: expect.any(Array),
      blockedBy: ['coverage-rules'],
    });
  });

  it('allows commit when appeal validator ACKs the appeal', () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"NACK","reason":"Missing tests"}',
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"ACK"}',
      });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const appealValidator: Validator = {
      name: 'appeal-system',
      description: 'Appeal validator',
      enabled: true,
      content: 'Evaluate appeal',
      path: '/appeal.md',
    };
    const context = {
      diff: '+a',
      files: ['a.txt'],
      message: 'feat: add feature [appeal: these files are tightly coupled]',
    };

    const result = handleCommitValidation(validators, context, executor, appealValidator);

    expect(result).toEqual({
      allowed: true,
      results: expect.any(Array),
      appeal: 'these files are tightly coupled',
    });
  });

  it('blocks commit when appeal validator NACKs the appeal', () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"NACK","reason":"Missing tests"}',
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: '{"decision":"NACK","reason":"Appeal does not justify violation"}',
      });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const appealValidator: Validator = {
      name: 'appeal-system',
      description: 'Appeal validator',
      enabled: true,
      content: 'Evaluate appeal',
      path: '/appeal.md',
    };
    const context = {
      diff: '+a',
      files: ['a.txt'],
      message: 'feat: add feature [appeal: please let this through]',
    };

    const result = handleCommitValidation(validators, context, executor, appealValidator);

    expect(result).toEqual({
      allowed: false,
      results: expect.any(Array),
      blockedBy: ['coverage-rules'],
    });
  });

  it('blocks commit when no appeal validator provided and NACK with appeal', () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: '{"decision":"NACK","reason":"Missing tests"}',
    });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = {
      diff: '+a',
      files: ['a.txt'],
      message: 'feat: add feature [appeal: coherence]',
    };

    const result = handleCommitValidation(validators, context, executor);

    expect(result).toEqual({
      allowed: false,
      results: expect.any(Array),
      blockedBy: ['coverage-rules'],
    });
  });
});

describe('formatBlockMessage', () => {
  it('formats block message with validator reasons and appeal instructions', () => {
    const results = [
      { validator: 'coverage-rules', decision: 'NACK' as const, reason: 'Missing tests', appealable: true },
    ];

    const message = formatBlockMessage(results);

    expect(message).toContain('coverage-rules: Missing tests');
    expect(message).toContain('[appeal: your justification]');
  });

  it('omits appeal instructions for non-appealable validators', () => {
    const results = [
      { validator: 'no-dangerous-git', decision: 'NACK' as const, reason: '--force forbidden', appealable: false },
    ];

    const message = formatBlockMessage(results);

    expect(message).toContain('no-dangerous-git: --force forbidden');
    expect(message).toContain('cannot be appealed');
  });
});
