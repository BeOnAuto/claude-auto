import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  extractAppeal,
  extractCdTarget,
  formatBlockMessage,
  getCommitContext,
  handleCommitValidation,
  isCommitCommand,
  parseBatchedOutput,
  parseClaudeJsonOutput,
  runAppealValidator,
  runValidator,
  spawnAsync,
  validateCommit,
} from './commit-validator.js';
import type { Validator } from './validator-loader.js';

function claudeJson(inner: Record<string, unknown>): string {
  return JSON.stringify({ type: 'result', subtype: 'success', result: JSON.stringify(inner) });
}

function claudeBatchJson(results: Array<{ id: string; decision: string; reason?: string }>): string {
  return JSON.stringify({ type: 'result', subtype: 'success', result: JSON.stringify(results) });
}

describe('spawnAsync', () => {
  it('resolves with stdout, stderr, and exit status from spawned process', async () => {
    const result = await spawnAsync('echo', ['hello'], { encoding: 'utf8' });

    expect(result).toEqual({
      stdout: 'hello\n',
      stderr: '',
      status: 0,
    });
  });

  it('captures stderr output from spawned process', async () => {
    const result = await spawnAsync('node', ['-e', 'process.stderr.write("oops")'], { encoding: 'utf8' });

    expect(result).toEqual({
      stdout: '',
      stderr: 'oops',
      status: 0,
    });
  });

  it('rejects when command does not exist', async () => {
    await expect(spawnAsync('nonexistent-cmd-xyz', [], { encoding: 'utf8' })).rejects.toThrow();
  });
});

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

  it('uses cd target from command when cwd is a non-repo parent', () => {
    // Previously this threw because getCommitContext ran git diff --cached
    // in the parent dir (not a repo). Now it extracts the cd target.
    const { execSync } = require('node:child_process');
    const parentDir = tempDir; // not a git repo
    const repoDir = path.join(parentDir, 'sub-repo');
    fs.mkdirSync(repoDir);
    execSync('git init', { cwd: repoDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: repoDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: repoDir, stdio: 'pipe' });
    fs.writeFileSync(path.join(repoDir, 'file.ts'), 'const x = 1;');
    execSync('git add file.ts', { cwd: repoDir, stdio: 'pipe' });

    const command = `cd ${repoDir} && git add file.ts && git commit -m "test: no-op"`;

    const result = getCommitContext(parentDir, command);

    expect(result).toEqual({
      diff: expect.stringContaining('+const x = 1;'),
      files: ['file.ts'],
      message: 'test: no-op',
    });
  });
});

describe('extractCdTarget', () => {
  it('extracts path from cd command', () => {
    expect(extractCdTarget('cd /foo/bar && git commit -m "msg"')).toBe('/foo/bar');
  });

  it('returns null when no cd prefix', () => {
    expect(extractCdTarget('git commit -m "msg"')).toBe(null);
  });

  it('extracts path when cd is followed by &&', () => {
    expect(extractCdTarget('cd /a/b/c && git add . && git commit -m "x"')).toBe('/a/b/c');
  });
});

describe('parseClaudeJsonOutput', () => {
  it('extracts inner result and total token usage from claude json wrapper', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"decision":"ACK"}',
      usage: { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 21684, cache_creation_input_tokens: 6728 },
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'ACK', inputTokens: 28415, outputTokens: 9 });
  });

  it('handles missing cache token fields in usage', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"decision":"ACK"}',
      usage: { input_tokens: 50, output_tokens: 10 },
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'ACK', inputTokens: 50, outputTokens: 10 });
  });

  it('extracts NACK with reason and tokens from wrapper', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"decision":"NACK","reason":"Missing tests"}',
      usage: { input_tokens: 150, output_tokens: 12 },
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'NACK', reason: 'Missing tests', inputTokens: 150, outputTokens: 12 });
  });

  it('returns outer object when result is not a string', () => {
    const stdout = '{"decision":"ACK"}';

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'ACK' });
  });

  it('defaults to NACK when decision is missing', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"some":"garbage"}',
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'NACK', reason: 'validator returned invalid response (no ACK decision)' });
  });

  it('defaults to NACK when decision is not ACK or NACK', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"decision":"MAYBE"}',
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'NACK', reason: 'validator returned invalid response (no ACK decision)' });
  });

  it('defaults to NACK when inner result is not valid JSON', () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: 'just some text response',
    });

    const parsed = parseClaudeJsonOutput(stdout);

    expect(parsed).toEqual({ decision: 'NACK', reason: 'validator returned invalid response (no ACK decision)' });
  });
});

describe('parseBatchedOutput', () => {
  it('parses valid batched JSON array from claude envelope', () => {
    const stdout = claudeBatchJson([
      { id: 'coverage-rules', decision: 'ACK' },
      { id: 'no-comments', decision: 'NACK', reason: 'Found comments' },
    ]);

    const results = parseBatchedOutput(stdout, ['coverage-rules', 'no-comments']);

    expect(results).toEqual([
      { validator: 'coverage-rules', decision: 'ACK' },
      { validator: 'no-comments', decision: 'NACK', reason: 'Found comments' },
    ]);
  });

  it('extracts JSON array from markdown code fences', () => {
    const inner = '```json\n[{"id":"v1","decision":"ACK"}]\n```';
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: inner });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([{ validator: 'v1', decision: 'ACK' }]);
  });

  it('NACKs validators missing from response', () => {
    const stdout = claudeBatchJson([{ id: 'v1', decision: 'ACK' }]);

    const results = parseBatchedOutput(stdout, ['v1', 'v2']);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK' },
      { validator: 'v2', decision: 'NACK', reason: 'validator missing or invalid in batched response' },
    ]);
  });

  it('NACKs all when response is unparseable', () => {
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: 'not json at all' });

    const results = parseBatchedOutput(stdout, ['v1', 'v2']);

    expect(results).toEqual([
      { validator: 'v1', decision: 'NACK', reason: 'batched validator returned unparseable response' },
      { validator: 'v2', decision: 'NACK', reason: 'batched validator returned unparseable response' },
    ]);
  });

  it('extracts JSON array from bracket match when top-level and fenced parsing fails', () => {
    const inner = 'Some preamble text [{"id":"v1","decision":"ACK"}] trailing text';
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: inner });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([{ validator: 'v1', decision: 'ACK' }]);
  });

  it('NACKs when fenced code block contains a JSON object instead of array', () => {
    const inner = '```json\n{"id":"v1","decision":"ACK"}\n```';
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: inner });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([
      { validator: 'v1', decision: 'NACK', reason: 'batched validator returned unparseable response' },
    ]);
  });

  it('NACKs when bracket match contains a JSON object instead of array', () => {
    const inner = 'text {"id":"v1","decision":"ACK"} more text';
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: inner });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([
      { validator: 'v1', decision: 'NACK', reason: 'batched validator returned unparseable response' },
    ]);
  });

  it('NACKs when top-level parse returns a non-array JSON object', () => {
    const inner = '{"id":"v1","decision":"ACK"}';
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: inner });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([
      { validator: 'v1', decision: 'NACK', reason: 'batched validator returned unparseable response' },
    ]);
  });

  it('accepts validator key as alias for id', () => {
    const inner = [{ validator: 'v1', decision: 'ACK' }];
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: JSON.stringify(inner) });

    const results = parseBatchedOutput(stdout, ['v1']);

    expect(results).toEqual([{ validator: 'v1', decision: 'ACK' }]);
  });
});

describe('runValidator', () => {
  it('calls executor with formatted prompt', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'ACK' }),
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

    await runValidator(validator, context, executor);

    expect(executor).toHaveBeenCalledWith(
      'claude',
      ['-p', '--no-session-persistence', expect.stringContaining('<diff>'), '--output-format', 'json'],
      expect.objectContaining({ encoding: 'utf8' }),
    );
  });

  it('includes validator content in prompt', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'ACK' }),
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

    await runValidator(validator, context, executor);

    const prompt = executor.mock.calls[0][1][2];
    expect(prompt).toContain('Check that tests pass');
    expect(prompt).toContain('<diff>');
    expect(prompt).toContain('+hello');
    expect(prompt).toContain('<commit-message>');
    expect(prompt).toContain('Test commit');
    expect(prompt).toContain('<files>');
    expect(prompt).toContain('test.txt');
  });

  it('parses ACK response from claude json wrapper', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        type: 'result',
        subtype: 'success',
        result: '{"decision":"ACK"}',
      }),
    });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = await runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'ACK' });
  });

  it('parses NACK response with reason', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'NACK', reason: 'Missing tests' }),
    });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = await runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'NACK', reason: 'Missing tests' });
  });

  it('retries once when response is invalid then succeeds', async () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeJson({ some: 'garbage' }),
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeJson({ decision: 'ACK' }),
      });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = await runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'ACK' });
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('returns NACK after retry also fails', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ some: 'garbage' }),
    });

    const validator: Validator = {
      name: 'test',
      description: 'Test',
      enabled: true,
      content: 'Check',
      path: '/test.md',
    };
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const result = await runValidator(validator, context, executor);

    expect(result).toEqual({ decision: 'NACK', reason: 'validator returned invalid response (no ACK decision)' });
    expect(executor).toHaveBeenCalledTimes(2);
  });
});

describe('runAppealValidator', () => {
  it('includes validator results and appeal in prompt', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'ACK' }),
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

    await runAppealValidator(appealValidator, context, results, appeal, executor);

    const prompt = executor.mock.calls[0][1][2];
    expect(prompt).toContain('<validator-results>');
    expect(prompt).toContain('coverage-rules: NACK - Missing tests');
    expect(prompt).toContain('<appeal>');
    expect(prompt).toContain('these files are tightly coupled');
    expect(prompt).toContain('Judge the appeal');
  });

  it('returns ACK when appeal is valid', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'ACK' }),
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

    const result = await runAppealValidator(appealValidator, context, results, 'coherence', executor);

    expect(result).toEqual({ decision: 'ACK' });
  });

  it('returns NACK when appeal is invalid', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeJson({ decision: 'NACK', reason: 'Appeal does not justify violation' }),
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

    const result = await runAppealValidator(appealValidator, context, results, 'please let me in', executor);

    expect(result).toEqual({ decision: 'NACK', reason: 'Appeal does not justify violation' });
  });
});

describe('validateCommit', () => {
  it('builds batched prompt with validator tags and stripped boilerplate', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeBatchJson([{ id: 'v1', decision: 'ACK' }]),
    });

    const boilerplateContent = `You are a commit validator. You MUST respond with ONLY a JSON object, no other text.

Valid responses:
{"decision":"ACK"}
{"decision":"NACK","reason":"one sentence explanation"}

Check for tests.

RESPOND WITH JSON ONLY - NO PROSE, NO MARKDOWN, NO EXPLANATION OUTSIDE THE JSON.`;

    const validators: Validator[] = [
      { name: 'v1', description: 'd1', enabled: true, content: boilerplateContent, path: '/v1.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    await validateCommit(validators, context, executor);

    const prompt = executor.mock.calls[0][1][2];
    expect(prompt).toContain('<validator id="v1">');
    expect(prompt).toContain('Check for tests.');
    expect(prompt).not.toContain('You are a commit validator. You MUST');
    expect(prompt).not.toContain('RESPOND WITH JSON ONLY');
    expect(prompt).not.toContain('Valid responses:');
    expect(prompt).toContain('Respond with ONLY a JSON array');
  });

  it('runs batches in parallel and returns flattened results', async () => {
    const callLog: string[] = [];

    const asyncExecutor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      const prompt = args[2];
      const batchName = prompt.includes('"v1"') ? 'batch-0' : prompt.includes('"v2"') ? 'batch-1' : 'batch-2';
      callLog.push(`start:${batchName}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          callLog.push(`end:${batchName}`);
          const id = batchName === 'batch-0' ? 'v1' : batchName === 'batch-1' ? 'v2' : 'v3';
          resolve({ status: 0, stdout: claudeBatchJson([{ id, decision: 'ACK' }]) });
        }, 50);
      });
    });

    const validators: Validator[] = [
      { name: 'v1', description: 'd1', enabled: true, content: 'c1', path: '/v1.md' },
      { name: 'v2', description: 'd2', enabled: true, content: 'c2', path: '/v2.md' },
      { name: 'v3', description: 'd3', enabled: true, content: 'c3', path: '/v3.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = await validateCommit(validators, context, asyncExecutor);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK', appealable: true },
      { validator: 'v2', decision: 'ACK', appealable: true },
      { validator: 'v3', decision: 'ACK', appealable: true },
    ]);
    expect(asyncExecutor).toHaveBeenCalledTimes(3);
    expect(callLog).toEqual([
      'start:batch-0',
      'start:batch-1',
      'start:batch-2',
      'end:batch-0',
      'end:batch-1',
      'end:batch-2',
    ]);
  });

  it('aggregates NACK reasons from batched responses', async () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({ status: 0, stdout: claudeBatchJson([{ id: 'v1', decision: 'ACK' }]) })
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeBatchJson([{ id: 'v2', decision: 'NACK', reason: 'Missing tests' }]),
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeBatchJson([{ id: 'v3', decision: 'NACK', reason: 'No coverage' }]),
      });

    const validators: Validator[] = [
      { name: 'v1', description: 'd1', enabled: true, content: 'c1', path: '/v1.md' },
      { name: 'v2', description: 'd2', enabled: true, content: 'c2', path: '/v2.md' },
      { name: 'v3', description: 'd3', enabled: true, content: 'c3', path: '/v3.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = await validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK', appealable: true },
      { validator: 'v2', decision: 'NACK', reason: 'Missing tests', appealable: true },
      { validator: 'v3', decision: 'NACK', reason: 'No coverage', appealable: true },
    ]);
  });

  it('marks no-dangerous-git as not appealable', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeBatchJson([{ id: 'no-dangerous-git', decision: 'NACK', reason: '--force is forbidden' }]),
    });

    const validators: Validator[] = [
      { name: 'no-dangerous-git', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = await validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'no-dangerous-git', decision: 'NACK', reason: '--force is forbidden', appealable: false },
    ]);
  });

  it('NACKs all validators in a batch when executor throws', async () => {
    const executor = vi.fn().mockRejectedValue(new Error('connection refused'));

    const validators: Validator[] = [{ name: 'v1', description: 'd', enabled: true, content: 'c', path: '/v.md' }];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = await validateCommit(validators, context, executor);

    expect(results).toEqual([
      { validator: 'v1', decision: 'NACK', reason: 'validator crashed: Error: connection refused', appealable: false },
    ]);
  });

  it('logs shared token counts for all validators in a batch', async () => {
    const stdout = JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: JSON.stringify([{ id: 'v1', decision: 'ACK' }]),
      usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 },
    });
    const executor = vi.fn().mockReturnValue({ status: 0, stdout });
    const logs: Array<{ event: string; name: string; detail?: string }> = [];
    const onLog = (event: string, name: string, detail?: string) => {
      logs.push({ event, name, detail });
    };

    const validators: Validator[] = [{ name: 'v1', description: 'd', enabled: true, content: 'c', path: '/v.md' }];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    await validateCommit(validators, context, executor, onLog);

    expect(logs).toEqual([
      { event: 'spawn', name: 'batch-0', detail: 'validators: v1' },
      { event: 'complete', name: 'v1', detail: 'ACK (in:150 out:20)' },
    ]);
  });

  it('uses provided batchCount to control chunk size', async () => {
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      const prompt = args[2];
      if (prompt.includes('"v1"') && prompt.includes('"v2"')) {
        return {
          status: 0,
          stdout: claudeBatchJson([
            { id: 'v1', decision: 'ACK' },
            { id: 'v2', decision: 'ACK' },
          ]),
        };
      }
      return {
        status: 0,
        stdout: claudeBatchJson([
          { id: 'v3', decision: 'ACK' },
          { id: 'v4', decision: 'ACK' },
        ]),
      };
    });

    const validators: Validator[] = [
      { name: 'v1', description: 'd', enabled: true, content: 'c1', path: '/v1.md' },
      { name: 'v2', description: 'd', enabled: true, content: 'c2', path: '/v2.md' },
      { name: 'v3', description: 'd', enabled: true, content: 'c3', path: '/v3.md' },
      { name: 'v4', description: 'd', enabled: true, content: 'c4', path: '/v4.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'msg' };

    const results = await validateCommit(validators, context, executor, undefined, 2);

    expect(results).toEqual([
      { validator: 'v1', decision: 'ACK', appealable: true },
      { validator: 'v2', decision: 'ACK', appealable: true },
      { validator: 'v3', decision: 'ACK', appealable: true },
      { validator: 'v4', decision: 'ACK', appealable: true },
    ]);
    expect(executor).toHaveBeenCalledTimes(2);
  });
});

describe('handleCommitValidation', () => {
  it('allows commit when all validators ACK', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeBatchJson([{ id: 'v1', decision: 'ACK' }]),
    });
    const validators: Validator[] = [{ name: 'v1', description: 'd', enabled: true, content: 'c', path: '/v.md' }];
    const context = { diff: '+a', files: ['a.txt'], message: 'feat: add feature' };

    const result = await handleCommitValidation(validators, context, executor);

    expect(result).toEqual({ allowed: true, results: expect.any(Array) });
  });

  it('blocks commit when validator NACKs without appeal', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeBatchJson([{ id: 'coverage-rules', decision: 'NACK', reason: 'Missing tests' }]),
    });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = { diff: '+a', files: ['a.txt'], message: 'feat: add feature' };

    const result = await handleCommitValidation(validators, context, executor);

    expect(result).toEqual({
      allowed: false,
      results: expect.any(Array),
      blockedBy: ['coverage-rules'],
    });
  });

  it('allows commit when appeal validator ACKs the appeal', async () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeBatchJson([{ id: 'coverage-rules', decision: 'NACK', reason: 'Missing tests' }]),
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeJson({ decision: 'ACK' }),
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

    const result = await handleCommitValidation(validators, context, executor, appealValidator);

    expect(result).toEqual({
      allowed: true,
      results: expect.any(Array),
      appeal: 'these files are tightly coupled',
    });
  });

  it('blocks commit when appeal validator NACKs the appeal', async () => {
    const executor = vi
      .fn()
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeBatchJson([{ id: 'coverage-rules', decision: 'NACK', reason: 'Missing tests' }]),
      })
      .mockReturnValueOnce({
        status: 0,
        stdout: claudeJson({ decision: 'NACK', reason: 'Appeal does not justify violation' }),
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

    const result = await handleCommitValidation(validators, context, executor, appealValidator);

    expect(result).toEqual({
      allowed: false,
      results: expect.any(Array),
      blockedBy: ['coverage-rules'],
    });
  });

  it('blocks commit when no appeal validator provided and NACK with appeal', async () => {
    const executor = vi.fn().mockReturnValue({
      status: 0,
      stdout: claudeBatchJson([{ id: 'coverage-rules', decision: 'NACK', reason: 'Missing tests' }]),
    });
    const validators: Validator[] = [
      { name: 'coverage-rules', description: 'd', enabled: true, content: 'c', path: '/v.md' },
    ];
    const context = {
      diff: '+a',
      files: ['a.txt'],
      message: 'feat: add feature [appeal: coherence]',
    };

    const result = await handleCommitValidation(validators, context, executor);

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
