import { Command } from 'commander';

import { install } from './install.js';

export function createCli(): Command {
  const program = new Command();

  program.name('claude-ketchup').description('Husky-style hooks and skills management for Claude Code');

  program
    .command('install')
    .description('Install claude-ketchup into the current project')
    .action(async () => {
      const result = await install();
      console.log(`Installed claude-ketchup into ${result.projectRoot}`);
      if (result.addedDependency) {
        console.log('Added claude-ketchup to devDependencies');
      }
      console.log(`Symlinked ${result.symlinkedFiles.length} files:`);
      for (const file of result.symlinkedFiles) {
        console.log(`  ${file}`);
      }
    });

  program.command('status').description('Show symlink status');

  program.command('doctor').description('Diagnose symlink health');

  program.command('repair').description('Recreate symlinks');

  program.command('reminders').description('List reminders with metadata');

  return program;
}
