import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getCommitContext, isCommitCommand } from './commit-validator.js';

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
