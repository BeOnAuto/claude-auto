import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePathsFromEnv } from './path-resolver.js';

describe('resolvePathsFromEnv', () => {
  beforeEach(() => {
    vi.stubEnv('CLAUDE_PLUGIN_ROOT', '');
    vi.stubEnv('CLAUDE_PLUGIN_DATA', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns plugin-mode paths when CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA are set', async () => {
    vi.stubEnv('CLAUDE_PLUGIN_ROOT', '/plugins/claude-auto');
    vi.stubEnv('CLAUDE_PLUGIN_DATA', '/data/claude-auto');

    const result = await resolvePathsFromEnv();

    expect(result).toEqual({
      projectRoot: process.cwd(),
      claudeDir: path.join(process.cwd(), '.claude'),
      autoDir: path.join(process.cwd(), '.claude-auto'),
      validatorsDirs: ['/plugins/claude-auto/validators', path.join(process.cwd(), '.claude-auto', 'validators')],
      remindersDirs: ['/plugins/claude-auto/reminders', path.join(process.cwd(), '.claude-auto', 'reminders')],
    });
  });

  it('throws when env vars are not set', async () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    delete process.env.CLAUDE_PLUGIN_DATA;

    await expect(resolvePathsFromEnv()).rejects.toThrow(
      'CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA must be set. Claude Auto requires plugin mode.',
    );
  });

  it('throws when only CLAUDE_PLUGIN_ROOT is set', async () => {
    vi.stubEnv('CLAUDE_PLUGIN_ROOT', '/plugins/claude-auto');
    delete process.env.CLAUDE_PLUGIN_DATA;

    await expect(resolvePathsFromEnv()).rejects.toThrow(
      'CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA must be set. Claude Auto requires plugin mode.',
    );
  });

  it('includes project-local dirs for multi-dir loading', async () => {
    vi.stubEnv('CLAUDE_PLUGIN_ROOT', '/plugins/claude-auto');
    vi.stubEnv('CLAUDE_PLUGIN_DATA', '/data/claude-auto');

    const result = await resolvePathsFromEnv();

    expect(result.validatorsDirs).toHaveLength(2);
    expect(result.remindersDirs).toHaveLength(2);
    expect(result.validatorsDirs[0]).toBe('/plugins/claude-auto/validators');
    expect(result.remindersDirs[0]).toBe('/plugins/claude-auto/reminders');
  });
});
