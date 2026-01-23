import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from '../config-loader.js';
import { getStatus } from './status.js';

describe('cli status', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-status-'));
    packageDir = path.join(tempDir, 'claude-ketchup');
    claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it('lists expected symlinks from scripts and commands directories', async () => {
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'scripts', 'session-start.ts'), 'export default {}');
    fs.writeFileSync(path.join(packageDir, 'commands', 'cmd.md'), '# Command');

    const result = await getStatus(packageDir, claudeDir);

    expect(result.symlinks).toContainEqual({ path: 'scripts/session-start.ts', status: 'ok' });
    expect(result.symlinks).toContainEqual({ path: 'commands/cmd.md', status: 'ok' });
  });

  it('lists ketchup files with ketchup prefix', async () => {
    fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'validators', 'rule.md'), '');
    fs.writeFileSync(path.join(packageDir, 'reminders', 'reminder.md'), '');

    const result = await getStatus(packageDir, claudeDir);

    expect(result.symlinks).toContainEqual({ path: `${DEFAULT_KETCHUP_DIR}/validators/rule.md`, status: 'ok' });
    expect(result.symlinks).toContainEqual({ path: `${DEFAULT_KETCHUP_DIR}/reminders/reminder.md`, status: 'ok' });
  });

  it('returns empty symlinks when no directories exist', async () => {
    const result = await getStatus(packageDir, claudeDir);

    expect(result).toEqual({ symlinks: [] });
  });
});
