import { Command } from 'commander';

import { install } from './install.js';

async function runTui(): Promise<void> {
  const { launchTui } = await import('./tui/launcher.js');
  const cwd = process.cwd();

  process.stdout.write('\x1b[?25l');

  const result = launchTui({
    dir: cwd,
    write: (s) => process.stdout.write(s),
    cols: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  });

  if (!result.ok) {
    process.stdout.write('\x1b[?25h');
    console.error('No claude-auto configuration found in this directory.');
    console.error('Run `claude-ketchup install` first.');
    process.exit(1);
  }

  process.stdout.on('resize', () => {
    result.tui.resize(process.stdout.columns || 80, process.stdout.rows || 24);
  });

  process.on('SIGINT', () => {
    result.tui.stop();
    process.stdout.write('\x1b[?25h');
    process.exit(0);
  });
}

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

  program.command('tui').description('Launch interactive TUI with live log tailing').action(runTui);

  program.action(async () => {
    const { isAutoConfigured } = await import('./tui/detect.js');
    if (isAutoConfigured(process.cwd())) {
      await runTui();
    } else {
      program.help();
    }
  });

  return program;
}
