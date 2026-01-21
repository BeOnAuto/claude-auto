import { describe, expect, it } from 'vitest';

import { isCommitCommand } from './commit-validator.js';

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
