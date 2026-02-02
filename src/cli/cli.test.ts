import { describe, expect, it } from 'vitest';

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
      name: 'claude-ketchup',
      description: 'Husky-style hooks and skills management for Claude Code',
      commands: ['install', 'status', 'doctor', 'repair', 'reminders'],
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
