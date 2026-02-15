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

  it('logs granular summary for fresh install', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'install', tempDir]);

    vi.restoreAllMocks();

    expect(logs.length).toBe(1);
    expect(logs[0]).toMatch(/^Installed claude-auto: added/);
    expect(logs[0]).toMatch(/script/);
    expect(logs[0]).toMatch(/validator/);
    expect(logs[0]).toMatch(/reminder/);
    expect(logs[0]).toMatch(/agent/);
    expect(logs[0]).toMatch(/settings\.json/);
  });

  it('logs up to date message when nothing changed', async () => {
    await createCli().parseAsync(['node', 'claude-auto', 'install', tempDir]);

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'install', tempDir]);

    vi.restoreAllMocks();

    expect(logs).toEqual(['claude-auto up to date']);
  });

  it('logs granular update message when files changed', async () => {
    await createCli().parseAsync(['node', 'claude-auto', 'install', tempDir]);

    fs.writeFileSync(path.join(tempDir, '.claude-auto', 'scripts', 'session-start.js'), 'modified');

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'install', tempDir]);

    vi.restoreAllMocks();

    expect(logs.length).toBe(1);
    expect(logs[0]).toMatch(/^Updated claude-auto: updated 1 script$/);
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

  it('renders tui output to stdout on successful launch', async () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');

    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    vi.spyOn(process.stdout, 'on').mockReturnValue(process.stdout);
    vi.spyOn(process, 'on').mockReturnValue(process);

    Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 24, configurable: true });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'tui']);

    expect(writes[0]).toBe('\x1b[?25l');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape sequences
    expect(writes[1]).toMatch(/\x1b\[2J\x1b\[H[\s\S]*activity log[\s\S]*waiting for activity/);

    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });

  it('resize handler updates tui dimensions', async () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');

    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);

    let resizeHandler: (() => void) | undefined;
    vi.spyOn(process.stdout, 'on').mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'resize') resizeHandler = handler as () => void;
      return process.stdout;
    });
    vi.spyOn(process, 'on').mockReturnValue(process);

    Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 24, configurable: true });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'tui']);

    writes.length = 0;
    Object.defineProperty(process.stdout, 'columns', { value: 0, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 0, configurable: true });
    resizeHandler!();

    // biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape sequences
    expect(writes[0]).toMatch(/\x1b\[2J\x1b\[H[\s\S]*activity log/);

    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });

  it('SIGINT handler stops tui and restores cursor', async () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');

    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    vi.spyOn(process.stdout, 'on').mockReturnValue(process.stdout);

    let sigintHandler: (() => void) | undefined;
    vi.spyOn(process, 'on').mockImplementation((event: string | symbol, handler: (...args: unknown[]) => void) => {
      if (event === 'SIGINT') sigintHandler = handler as () => void;
      return process;
    });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 24, configurable: true });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto', 'tui']);

    writes.length = 0;

    expect(() => sigintHandler!()).toThrow('process.exit');
    expect(writes).toEqual(['\x1b[?25h']);

    exitSpy.mockRestore();
    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });
});

describe('default action', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-default-action-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('shows help when not auto-configured', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });

    const program = createCli();
    program.exitOverride();

    try {
      await program.parseAsync(['node', 'claude-auto']);
    } catch {
      // exitOverride throws on help
    }

    expect(writes).toEqual([expect.stringMatching(/Usage:.*claude-auto/)]);

    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });

  it('launches tui when auto-configured', async () => {
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');

    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    vi.spyOn(process.stdout, 'on').mockReturnValue(process.stdout);
    vi.spyOn(process, 'on').mockReturnValue(process);

    Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 24, configurable: true });

    const program = createCli();
    program.exitOverride();
    await program.parseAsync(['node', 'claude-auto']);

    expect(writes[0]).toBe('\x1b[?25l');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape sequences
    expect(writes[1]).toMatch(/\x1b\[2J\x1b\[H[\s\S]*activity log[\s\S]*waiting for activity/);

    cwdSpy.mockRestore();
    stdoutWrite.mockRestore();
    vi.restoreAllMocks();
  });
});
