import * as fs from 'node:fs';
import * as path from 'node:path';

import { createHookState } from '../hook-state.js';

export type InstallResult = {
  targetDir: string;
  claudeDir: string;
  settingsCreated: boolean;
};

const debug = process.env.DEBUG ? (...args: unknown[]) => console.error('[ketchup]', ...args) : () => {};

function getPackageRoot(): string {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      debug('packageRoot:', dir, '(__dirname:', __dirname, ')');
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`Could not find package root from ${__dirname}`);
}

function copyDir(sourceDir: string, targetDir: string): void {
  debug('copyDir:', sourceDir, '→', targetDir);
  if (!fs.existsSync(sourceDir)) {
    debug('  source does not exist, skipping');
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      debug('  copy:', entry.name);
      fs.copyFileSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
    }
  }
}

export async function install(targetPath?: string): Promise<InstallResult> {
  const resolvedTarget = path.resolve(targetPath ?? '.');
  const claudeDir = path.join(resolvedTarget, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const pkgRoot = getPackageRoot();

  debug('target:', resolvedTarget);
  debug('claudeDir:', claudeDir);

  fs.mkdirSync(claudeDir, { recursive: true });

  let settingsCreated = false;
  if (!fs.existsSync(settingsPath)) {
    const templatePath = path.join(pkgRoot, 'templates', 'settings.json');
    debug('template:', templatePath);
    const template = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(settingsPath, template);
    settingsCreated = true;
    debug('settings.json created');
  } else {
    debug('settings.json already exists, skipping');
  }

  copyDir(path.join(pkgRoot, 'dist', 'bundle', 'scripts'), path.join(claudeDir, 'scripts'));
  copyDir(path.join(pkgRoot, 'commands'), path.join(claudeDir, 'commands'));

  const ketchupDir = path.join(resolvedTarget, '.ketchup');
  copyDir(path.join(pkgRoot, 'validators'), path.join(ketchupDir, 'validators'));
  copyDir(path.join(pkgRoot, 'reminders'), path.join(ketchupDir, 'reminders'));

  // Initialize hook state with defaults if it doesn't exist
  const hookState = createHookState(ketchupDir);
  hookState.read();

  return { targetDir: resolvedTarget, claudeDir, settingsCreated };
}
