import { describe, it, expect } from 'vitest';

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
      commands: ['status', 'doctor', 'repair', 'reminders'],
    });
  });
});
