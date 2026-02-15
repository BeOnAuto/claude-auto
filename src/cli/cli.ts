import { Command } from 'commander';

import type { CopyResult, InstallResult } from './install.js';
import { install } from './install.js';

function formatInstallSummary(result: InstallResult): string {
  const parts: string[] = [];

  const formatCategory = (copy: CopyResult, singular: string, plural: string): void => {
    if (copy.added.length > 0) {
      parts.push(`added ${copy.added.length} ${copy.added.length === 1 ? singular : plural}`);
    }
    if (copy.updated.length > 0) {
      parts.push(`updated ${copy.updated.length} ${copy.updated.length === 1 ? singular : plural}`);
    }
    if (copy.removed.length > 0) {
      parts.push(`removed ${copy.removed.length} ${copy.removed.length === 1 ? singular : plural}`);
    }
  };

  formatCategory(result.scripts, 'script', 'scripts');
  formatCategory(result.validators, 'validator', 'validators');
  formatCategory(result.reminders, 'reminder', 'reminders');
  formatCategory(result.agents, 'agent', 'agents');
  formatCategory(result.commands, 'command', 'commands');

  if (result.settingsCreated) {
    parts.push('settings.json');
  }

  if (parts.length === 0) {
    return 'claude-auto up to date';
  }

  const prefix = result.status === 'installed' ? 'Installed' : 'Updated';
  return `${prefix} claude-auto: ${parts.join(', ')}`;
}

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
      console.log(formatInstallSummary(result));
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
