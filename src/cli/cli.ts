import { Command } from 'commander';

import { install } from './install.js';

export function createCli(): Command {
  const program = new Command();

  program.name('claude-auto').description('Husky-style hooks and skills management for Claude Code');

  program
    .command('install')
    .description('Install claude-auto hooks configuration into a project')
    .argument('[path]', 'target project directory', '.')
    .option('--local', 'install from source using tsx (for local dev)')
    .action(async (targetPath: string, options: { local?: boolean }) => {
      const result = await install(targetPath, { local: options.local });
      if (result.status === 'updated') {
        console.log(`claude-auto already installed, updating ${result.targetDir}`);
      } else {
        console.log(`Installing claude-auto into ${result.targetDir}`);
        if (result.settingsCreated) {
          console.log(`Created ${result.claudeDir}/settings.json`);
        }
      }
    });

  program.command('status').description('Show symlink status');

  program.command('doctor').description('Diagnose symlink health');

  program.command('repair').description('Recreate symlinks');

  program.command('reminders').description('List reminders with metadata');

  return program;
}
