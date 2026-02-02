import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { install } from './install.js';

describe('cli install', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-install-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates .claude directory at given path', async () => {
    await install(tempDir);

    expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true);
    expect(fs.statSync(path.join(tempDir, '.claude')).isDirectory()).toBe(true);
  });

  it('creates settings.json with all hook types', async () => {
    await install(tempDir);

    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.SessionStart).toBeDefined();
    expect(settings.hooks.PreToolUse).toBeDefined();
    expect(settings.hooks.UserPromptSubmit).toBeDefined();
    expect(settings.hooks.Stop).toBeDefined();
  });

  it('copies bundled scripts to .claude/scripts/', async () => {
    await install(tempDir);

    const scriptsDir = path.join(tempDir, '.claude', 'scripts');
    expect(fs.existsSync(path.join(scriptsDir, 'session-start.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'pre-tool-use.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'user-prompt-submit.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'auto-continue.js'))).toBe(true);

    // Must be regular files, not symlinks
    expect(fs.lstatSync(path.join(scriptsDir, 'session-start.js')).isSymbolicLink()).toBe(false);
  });

  it('copies commands to .claude/commands/', async () => {
    await install(tempDir);

    const commandsDir = path.join(tempDir, '.claude', 'commands');
    expect(fs.existsSync(path.join(commandsDir, 'ketchup.md'))).toBe(true);
    expect(fs.lstatSync(path.join(commandsDir, 'ketchup.md')).isSymbolicLink()).toBe(false);
  });

  it('copies validators to .ketchup/validators/', async () => {
    await install(tempDir);

    const validatorsDir = path.join(tempDir, '.ketchup', 'validators');
    expect(fs.existsSync(validatorsDir)).toBe(true);
    const files = fs.readdirSync(validatorsDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(fs.lstatSync(path.join(validatorsDir, file)).isSymbolicLink()).toBe(false);
    }
  });

  it('copies reminders to .ketchup/reminders/', async () => {
    await install(tempDir);

    const remindersDir = path.join(tempDir, '.ketchup', 'reminders');
    expect(fs.existsSync(remindersDir)).toBe(true);
    const files = fs.readdirSync(remindersDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(fs.lstatSync(path.join(remindersDir, file)).isSymbolicLink()).toBe(false);
    }
  });

  it('resolves "." to current working directory', async () => {
    const result = await install(tempDir);

    expect(result.targetDir).toBe(path.resolve(tempDir));
  });

  it('does not overwrite existing settings.json', async () => {
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const existingSettings = { custom: true };
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify(existingSettings));

    const result = await install(tempDir);

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'));
    expect(settings).toEqual(existingSettings);
    expect(result.settingsCreated).toBe(false);
  });

  it('is idempotent — running install twice succeeds', async () => {
    await install(tempDir);
    const result = await install(tempDir);

    expect(result.claudeDir).toBe(path.join(tempDir, '.claude'));
    expect(result.settingsCreated).toBe(false);
  });

  it('returns result with correct paths and flags', async () => {
    const result = await install(tempDir);

    expect(result.targetDir).toBe(tempDir);
    expect(result.claudeDir).toBe(path.join(tempDir, '.claude'));
    expect(result.settingsCreated).toBe(true);
  });
});
