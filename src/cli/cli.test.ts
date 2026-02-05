import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCli } from './cli.js';

describe('createCli', () => {
  it('creates program with name, description, and all commands', () => {
    const program = createCli();
    const commands = program.commands.map((cmd) => cmd.name());

    expect({
      name: program.name(),
      description: program.description(),
      commands,
    }).toEqual({
      name: 'claude-auto',
      description: 'Husky-style hooks and skills management for Claude Code',
      commands: ['install', 'status', 'doctor', 'repair', 'reminders', 'tui'],
    });
  });

  it('install command accepts an optional path argument', () => {
    const program = createCli();
    const installCmd = program.commands.find((cmd) => cmd.name() === 'install');
    expect(installCmd).toBeDefined();
    expect(installCmd!.registeredArguments).toHaveLength(1);
    expect(installCmd!.registeredArguments[0].required).toBe(false);
  });
});

describe('install action', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-install-action-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('logs installation message for fresh install', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'install', tempDir]);

    vi.restoreAllMocks();

    expect(logs).toEqual([
      `Installing claude-auto into ${tempDir}`,
      `Created ${path.join(tempDir, '.claude')}/settings.json`,
    ]);
  });

  it('logs update message for already installed project', async () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), '{}');

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'install', tempDir]);

    vi.restoreAllMocks();

    expect(logs).toEqual([`claude-auto already installed, updating ${tempDir}`]);
  });
});

describe('tui action', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tui-action-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('exits with error when launchTui returns not-configured', async () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    const program = createCli();
    program.exitOverride();

    await expect(program.parseAsync(['node', 'claude-auto', 'tui'])).rejects.toThrow('process.exit');

    expect(errors).toEqual([
      'No claude-auto configuration found in this directory.',
      'Run `claude-ketchup install` first.',
    ]);

    exitSpy.mockRestore();
    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });
});
