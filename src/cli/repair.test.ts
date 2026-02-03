import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_AUTO_DIR } from '../config-loader.js';
import { getExpectedSymlinks, repair } from './repair.js';

describe('cli repair', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-repair-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-auto');
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
      autoFiles: [],
    });

    expect(result).toEqual({
      repaired: ['commands/cmd.md'],
    });
    expect(fs.readlinkSync(path.join(claudeDir, 'commands', 'cmd.md'))).toBe(sourceFile);
  });

  it('repairs auto files to auto directory', async () => {
    fs.mkdirSync(path.join(packageDir, '.claude-auto', 'validators'), { recursive: true });
    const sourceFile = path.join(packageDir, '.claude-auto', 'validators', 'rule.md');
    fs.writeFileSync(sourceFile, '');

    const result = await repair(packageDir, claudeDir, {
      claudeFiles: [],
      autoFiles: ['validators/rule.md'],
    });

    expect(result.repaired).toContain(`${DEFAULT_AUTO_DIR}/validators/rule.md`);
    const symlinkTarget = fs.readlinkSync(path.join(tempDir, DEFAULT_AUTO_DIR, 'validators', 'rule.md'));
    expect(symlinkTarget).toBe(sourceFile);
  });

  it('getExpectedSymlinks separates claude and auto files', () => {
    fs.writeFileSync(path.join(packageDir, 'commands', 'cmd.md'), '');
    fs.mkdirSync(path.join(packageDir, '.claude-auto', 'validators'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, '.claude-auto', 'validators', 'rule.md'), '');
    fs.mkdirSync(path.join(packageDir, '.claude-auto', 'reminders'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, '.claude-auto', 'reminders', 'reminder.md'), '');

    const result = getExpectedSymlinks(packageDir);

    expect(result.claudeFiles).toEqual(['commands/cmd.md']);
    expect(result.autoFiles).toEqual(['validators/rule.md', 'reminders/reminder.md']);
  });
});
