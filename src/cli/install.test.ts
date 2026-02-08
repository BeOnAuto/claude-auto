import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyDir, getPackageRoot, install, resolveScriptPaths } from './install.js';

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

  it('copies bundled scripts to .claude-auto/scripts/', async () => {
    await install(tempDir);

    const scriptsDir = path.join(tempDir, '.claude-auto', 'scripts');
    expect(fs.existsSync(path.join(scriptsDir, 'session-start.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'pre-tool-use.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'user-prompt-submit.js'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'auto-continue.js'))).toBe(true);

    // Must be regular files, not symlinks
    expect(fs.lstatSync(path.join(scriptsDir, 'session-start.js')).isSymbolicLink()).toBe(false);
  });

  it('skips .claude/commands/ when commands dir is empty', async () => {
    await install(tempDir);

    const commandsDir = path.join(tempDir, '.claude', 'commands');
    expect(fs.existsSync(commandsDir)).toBe(false);
  });

  it('copies validators to .claude-auto/validators/', async () => {
    await install(tempDir);

    const validatorsDir = path.join(tempDir, '.claude-auto', 'validators');
    expect(fs.existsSync(validatorsDir)).toBe(true);
    const files = fs.readdirSync(validatorsDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(fs.lstatSync(path.join(validatorsDir, file)).isSymbolicLink()).toBe(false);
    }
  });

  it('copies reminders to .claude-auto/reminders/', async () => {
    await install(tempDir);

    const remindersDir = path.join(tempDir, '.claude-auto', 'reminders');
    expect(fs.existsSync(remindersDir)).toBe(true);
    const files = fs.readdirSync(remindersDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(fs.lstatSync(path.join(remindersDir, file)).isSymbolicLink()).toBe(false);
    }
  });

  it('creates .claude-auto/.claude.hooks.json with defaults', async () => {
    await install(tempDir);

    const hookStatePath = path.join(tempDir, '.claude-auto', '.claude.hooks.json');
    expect(fs.existsSync(hookStatePath)).toBe(true);

    const state = JSON.parse(fs.readFileSync(hookStatePath, 'utf-8'));
    expect(state.autoContinue.mode).toBe('smart');
    expect(state.validateCommit.mode).toBe('strict');
    expect(state.denyList.enabled).toBe(true);
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

  it('returns status "installed" on fresh install', async () => {
    const result = await install(tempDir);

    expect(result.status).toBe('installed');
  });

  it('returns status "updated" when .claude-auto/.claude.hooks.json already exists', async () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), '{}');

    const result = await install(tempDir);

    expect(result.status).toBe('updated');
  });

  it('returns status "updated" on second install', async () => {
    await install(tempDir);
    const result = await install(tempDir);

    expect(result.status).toBe('updated');
  });

  it('migrates .ketchup/ to .claude-auto/ when legacy dir exists', async () => {
    const legacyDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'marker.txt'), 'legacy');

    await install(tempDir);

    expect(fs.existsSync(path.join(tempDir, '.ketchup'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, '.claude-auto', 'marker.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(tempDir, '.claude-auto', 'marker.txt'), 'utf-8')).toBe('legacy');
  });

  it('does not migrate .ketchup/ when .claude-auto/ already exists', async () => {
    const legacyDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'old.txt'), 'old');
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(autoDir, 'new.txt'), 'new');

    await install(tempDir);

    expect(fs.existsSync(path.join(tempDir, '.ketchup', 'old.txt'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.claude-auto', 'new.txt'))).toBe(true);
  });

  it('defaults to current directory when targetPath is undefined', async () => {
    const result = await install();

    expect(result.targetDir).toBe(path.resolve('.'));
  });

  it('creates settings.json with absolute script paths', async () => {
    await install(tempDir);

    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(
      `node ${tempDir}/.claude-auto/scripts/session-start.js`,
    );
    expect(settings.hooks.Stop[0].hooks[0].command).toBe(`node ${tempDir}/.claude-auto/scripts/auto-continue.js`);
  });
});

describe('local install', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-install-local-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates settings.json with tsx commands', async () => {
    await install(tempDir, { local: true });

    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('pnpm tsx scripts/session-start.ts');
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('pnpm tsx scripts/pre-tool-use.ts');
    expect(settings.hooks.UserPromptSubmit[0].hooks[0].command).toBe('pnpm tsx scripts/user-prompt-submit.ts');
    expect(settings.hooks.Stop[0].hooks[0].command).toBe('pnpm tsx scripts/auto-continue.ts');
  });

  it('does NOT copy bundled scripts to .claude-auto/scripts/', async () => {
    await install(tempDir, { local: true });

    const scriptsDir = path.join(tempDir, '.claude-auto', 'scripts');
    expect(fs.existsSync(scriptsDir)).toBe(false);
  });

  it('does NOT copy reminders', async () => {
    await install(tempDir, { local: true });

    const remindersDir = path.join(tempDir, '.claude-auto', 'reminders');
    expect(fs.existsSync(remindersDir)).toBe(false);
  });

  it('does NOT copy validators', async () => {
    await install(tempDir, { local: true });

    const validatorsDir = path.join(tempDir, '.claude-auto', 'validators');
    expect(fs.existsSync(validatorsDir)).toBe(false);
  });

  it('skips .claude/commands/ when commands dir is empty', async () => {
    await install(tempDir, { local: true });

    const commandsDir = path.join(tempDir, '.claude', 'commands');
    expect(fs.existsSync(commandsDir)).toBe(false);
  });

  it('initializes hook state at .claude-auto/.claude.hooks.json', async () => {
    await install(tempDir, { local: true });

    const hookStatePath = path.join(tempDir, '.claude-auto', '.claude.hooks.json');
    expect(fs.existsSync(hookStatePath)).toBe(true);

    const state = JSON.parse(fs.readFileSync(hookStatePath, 'utf-8'));
    expect(state.autoContinue.mode).toBe('smart');
    expect(state.validateCommit.mode).toBe('strict');
    expect(state.denyList.enabled).toBe(true);
  });

  it('returns status "installed" on fresh install', async () => {
    const result = await install(tempDir, { local: true });

    expect(result.status).toBe('installed');
  });

  it('returns status "updated" when .claude-auto/.claude.hooks.json exists', async () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), '{}');

    const result = await install(tempDir, { local: true });

    expect(result.status).toBe('updated');
  });

  it('is idempotent — running twice succeeds', async () => {
    await install(tempDir, { local: true });
    const result = await install(tempDir, { local: true });

    expect(result.claudeDir).toBe(path.join(tempDir, '.claude'));
    expect(result.settingsCreated).toBe(false);
    expect(result.status).toBe('updated');
  });
});

describe('getPackageRoot', () => {
  it('throws when no package.json exists up the directory tree', () => {
    expect(() => getPackageRoot('/')).toThrow('Could not find package root from /');
  });

  it('finds package root from a nested directory', () => {
    const root = getPackageRoot(__dirname);

    expect(root).toBe(path.resolve(__dirname, '..', '..'));
  });
});

describe('copyDir', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-copydir-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('skips when source directory does not exist', () => {
    const target = path.join(tempDir, 'target');

    copyDir(path.join(tempDir, 'nonexistent'), target);

    expect(fs.existsSync(target)).toBe(false);
  });

  it('skips when source directory has no files', () => {
    const source = path.join(tempDir, 'source');
    fs.mkdirSync(path.join(source, 'subdir'), { recursive: true });
    const target = path.join(tempDir, 'target');

    copyDir(source, target);

    expect(fs.existsSync(target)).toBe(false);
  });

  it('copies files from source to target', () => {
    const source = path.join(tempDir, 'source');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'a.txt'), 'content-a');
    fs.writeFileSync(path.join(source, 'b.txt'), 'content-b');
    const target = path.join(tempDir, 'target');

    copyDir(source, target);

    expect(fs.readFileSync(path.join(target, 'a.txt'), 'utf-8')).toBe('content-a');
    expect(fs.readFileSync(path.join(target, 'b.txt'), 'utf-8')).toBe('content-b');
  });
});

describe('install with DEBUG', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-install-debug-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('logs debug output when DEBUG is set', async () => {
    process.env.DEBUG = 'claude-auto';
    const calls: unknown[][] = [];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      calls.push(args);
    });

    await install(tempDir);

    delete process.env.DEBUG;
    errorSpy.mockRestore();

    expect(calls.every((c) => c[0] === '[claude-auto]')).toEqual(true);
    expect(calls.find((c) => c[1] === 'target:')).toEqual(['[claude-auto]', 'target:', tempDir]);
  });
});

describe('resolveScriptPaths', () => {
  it('replaces relative .claude-auto/scripts/ paths with absolute paths', () => {
    const template = '{"command": "node .claude-auto/scripts/session-start.js"}';
    const projectRoot = '/home/user/my-project';

    const result = resolveScriptPaths(template, projectRoot);

    expect(result).toBe('{"command": "node /home/user/my-project/.claude-auto/scripts/session-start.js"}');
  });

  it('handles multiple script paths in template', () => {
    const template = JSON.stringify({
      hooks: {
        SessionStart: [{ hooks: [{ command: 'node .claude-auto/scripts/session-start.js' }] }],
        Stop: [{ hooks: [{ command: 'node .claude-auto/scripts/auto-continue.js' }] }],
      },
    });

    const result = resolveScriptPaths(template, '/project');
    const parsed = JSON.parse(result);

    expect(parsed.hooks.SessionStart[0].hooks[0].command).toBe('node /project/.claude-auto/scripts/session-start.js');
    expect(parsed.hooks.Stop[0].hooks[0].command).toBe('node /project/.claude-auto/scripts/auto-continue.js');
  });

  it('does not modify non-script paths', () => {
    const template = '{"autoDir": ".claude-auto"}';

    const result = resolveScriptPaths(template, '/project');

    expect(result).toBe('{"autoDir": ".claude-auto"}');
  });

  it('normalizes project root with trailing slash', () => {
    const template = '{"command": "node .claude-auto/scripts/test.js"}';

    const result = resolveScriptPaths(template, '/project/');

    expect(result).toBe('{"command": "node /project/.claude-auto/scripts/test.js"}');
  });
});
