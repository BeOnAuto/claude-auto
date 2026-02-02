import { Command } from 'commander';

import { install } from './install.js';

export function createCli(): Command {
  const program = new Command();

  program.name('claude-ketchup').description('Husky-style hooks and skills management for Claude Code');

  program
    .command('install')
    .description('Install claude-ketchup hooks configuration into a project')
    .argument('[path]', 'target project directory', '.')
    .action(async (targetPath: string) => {
      const result = await install(targetPath);
      if (result.settingsCreated) {
        console.log(`Created ${result.claudeDir}/settings.json`);
      }
      console.log(`Installed claude-ketchup into ${result.targetDir}`);
    });

  program.command('status').description('Show symlink status');

  program.command('doctor').description('Diagnose symlink health');

  program.command('repair').description('Recreate symlinks');

  program.command('reminders').description('List reminders with metadata');

  return program;
}
