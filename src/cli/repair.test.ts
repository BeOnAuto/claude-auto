import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from '../config-loader.js';
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
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it('recreates symlinks for specified files', async () => {
    const sourceFile = path.join(packageDir, 'commands', 'cmd.md');
    fs.writeFileSync(sourceFile, 'export default {}');

    const result = await repair(packageDir, claudeDir, {
      claudeFiles: ['commands/cmd.md'],
      ketchupFiles: [],
    });

    expect(result).toEqual({
      repaired: ['commands/cmd.md'],
    });
    expect(fs.readlinkSync(path.join(claudeDir, 'commands', 'cmd.md'))).toBe(sourceFile);
  });

  it('repairs ketchup files to ketchup directory', async () => {
    fs.mkdirSync(path.join(packageDir, '.ketchup', 'validators'), { recursive: true });
    const sourceFile = path.join(packageDir, '.ketchup', 'validators', 'rule.md');
    fs.writeFileSync(sourceFile, '');

    const result = await repair(packageDir, claudeDir, {
      claudeFiles: [],
      ketchupFiles: ['validators/rule.md'],
    });

    expect(result.repaired).toContain(`${DEFAULT_KETCHUP_DIR}/validators/rule.md`);
    const symlinkTarget = fs.readlinkSync(path.join(tempDir, DEFAULT_KETCHUP_DIR, 'validators', 'rule.md'));
    expect(symlinkTarget).toBe(sourceFile);
  });

  it('getExpectedSymlinks separates claude and ketchup files', () => {
    fs.writeFileSync(path.join(packageDir, 'commands', 'cmd.md'), '');
    fs.mkdirSync(path.join(packageDir, '.ketchup', 'validators'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, '.ketchup', 'validators', 'rule.md'), '');
    fs.mkdirSync(path.join(packageDir, '.ketchup', 'reminders'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, '.ketchup', 'reminders', 'reminder.md'), '');

    const result = getExpectedSymlinks(packageDir);

    expect(result.claudeFiles).toEqual(['commands/cmd.md']);
    expect(result.ketchupFiles).toEqual(['validators/rule.md', 'reminders/reminder.md']);
  });
});
