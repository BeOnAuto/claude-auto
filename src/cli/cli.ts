import { Command } from 'commander';

export function createCli(): Command {
  const program = new Command();

  program.name('claude-ketchup').description('Husky-style hooks and skills management for Claude Code');

  program.command('status').description('Show symlink status');

  program.command('doctor').description('Diagnose symlink health');

  program.command('repair').description('Recreate symlinks');

  program.command('reminders').description('List reminders with metadata');

  return program;
}
