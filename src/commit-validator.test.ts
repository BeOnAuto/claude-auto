import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCommitContext,
  isCommitCommand,
  runValidator,
} from './commit-validator.js';
import type { Validator } from './validator-loader.js';

describe('isCommitCommand', () => {
  it('detects simple git commit', () => {
    expect(isCommitCommand('git commit -m "message"')).toBe(true);
  });

  it('detects git commit with add', () => {
    expect(isCommitCommand('git add -A && git commit -m "message"')).toBe(true);
  });

  it('detects git commit with heredoc', () => {
    expect(
      isCommitCommand('git commit -m "$(cat <<\'EOF\'\nmessage\nEOF\n)"')
    ).toBe(true);
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
      expect.objectContaining({ encoding: 'utf8' })
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
});
