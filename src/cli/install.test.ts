import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { install } from './install.js';

describe('cli install', () => {
  let tempDir: string;
  let packageDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-install-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-ketchup');

    fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });

    fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js'), 'export default {}');
    fs.writeFileSync(path.join(packageDir, 'commands', 'ketchup.md'), '# ketchup');
    fs.writeFileSync(path.join(packageDir, 'validators', 'no-comments.md'), '# no comments');
    fs.writeFileSync(path.join(packageDir, 'reminders', 'reminder-test.md'), '# reminder');

    // Pre-add claude-ketchup to devDependencies so install() skips npm install
    // and uses our mock packageDir instead
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ devDependencies: { 'claude-ketchup': '^0.7.0' } }),
    );

    process.env = { ...originalEnv, KETCHUP_ROOT: tempDir };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it('creates .claude and .ketchup directories', async () => {
    await install(packageDir);

    expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.ketchup'))).toBe(true);
  });

  it('symlinks scripts to .claude/scripts', async () => {
    await install(packageDir);

    const symlinkPath = path.join(tempDir, '.claude', 'scripts', 'session-start.js');
    expect(fs.existsSync(symlinkPath)).toBe(true);
    expect(fs.lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
  });

  it('symlinks commands to .claude/commands', async () => {
    await install(packageDir);

    const symlinkPath = path.join(tempDir, '.claude', 'commands', 'ketchup.md');
    expect(fs.existsSync(symlinkPath)).toBe(true);
    expect(fs.lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
  });

  it('symlinks validators to .ketchup/validators', async () => {
    await install(packageDir);

    const symlinkPath = path.join(tempDir, '.ketchup', 'validators', 'no-comments.md');
    expect(fs.existsSync(symlinkPath)).toBe(true);
    expect(fs.lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
  });

  it('symlinks reminders to .ketchup/reminders', async () => {
    await install(packageDir);

    const symlinkPath = path.join(tempDir, '.ketchup', 'reminders', 'reminder-test.md');
    expect(fs.existsSync(symlinkPath)).toBe(true);
    expect(fs.lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
  });

  it('returns result with all symlinked files', async () => {
    const result = await install(packageDir);

    expect(result.projectRoot).toBe(tempDir);
    expect(result.symlinkedFiles).toContain('scripts/session-start.js');
    expect(result.symlinkedFiles).toContain('commands/ketchup.md');
    expect(result.symlinkedFiles).toContain('.ketchup/validators/no-comments.md');
    expect(result.symlinkedFiles).toContain('.ketchup/reminders/reminder-test.md');
  });

  it('is idempotent - running install twice does not fail', async () => {
    await install(packageDir);
    const result = await install(packageDir);

    expect(result.symlinkedFiles.length).toBeGreaterThan(0);
  });
});
