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
});
