import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getExpectedSymlinks, repair } from './repair.js';

describe('cli repair', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-repair-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-ketchup');
    claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it('recreates symlinks for specified files', async () => {
    const sourceFile = path.join(packageDir, 'scripts', 'session-start.ts');
    fs.writeFileSync(sourceFile, 'export default {}');

    const result = await repair(packageDir, claudeDir, {
      claudeFiles: ['scripts/session-start.ts'],
      ketchupFiles: [],
    });

    expect(result).toEqual({
      repaired: ['scripts/session-start.ts'],
    });
    expect(fs.readlinkSync(path.join(claudeDir, 'scripts', 'session-start.ts'))).toBe(sourceFile);
  });

  it('repairs ketchup files to ketchup directory', async () => {
    fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
    const sourceFile = path.join(packageDir, 'validators', 'rule.md');
    fs.writeFileSync(sourceFile, '');

    const result = await repair(packageDir, claudeDir, {
      claudeFiles: [],
      ketchupFiles: ['validators/rule.md'],
    });

    expect(result.repaired).toContain('ketchup/validators/rule.md');
    expect(fs.readlinkSync(path.join(tempDir, 'ketchup', 'validators', 'rule.md'))).toBe(sourceFile);
  });

  it('getExpectedSymlinks separates claude and ketchup files', () => {
    fs.writeFileSync(path.join(packageDir, 'scripts', 'hook.ts'), '');
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'commands', 'cmd.md'), '');
    fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'validators', 'rule.md'), '');
    fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'reminders', 'reminder.md'), '');

    const result = getExpectedSymlinks(packageDir);

    expect(result.claudeFiles).toEqual([
      'scripts/hook.ts',
      'commands/cmd.md',
    ]);
    expect(result.ketchupFiles).toEqual([
      'validators/rule.md',
      'reminders/reminder.md',
    ]);
  });
});
