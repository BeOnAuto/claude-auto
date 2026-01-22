import * as fs from 'node:fs';
import * as path from 'node:path';

import { DEFAULT_KETCHUP_DIR, loadConfig } from './config-loader.js';
import { removeSymlink } from './linker.js';
import { findProjectRoot } from './root-finder.js';

const CLAUDE_SYMLINK_DIRS = ['scripts', 'commands'];
const KETCHUP_SYMLINK_DIRS = ['validators', 'reminders'];

function removeSymlinksInDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (fs.lstatSync(fullPath).isSymbolicLink()) {
      removeSymlink(fullPath);
    }
  }
}

export async function runPreuninstall(): Promise<void> {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');

  const config = await loadConfig(projectRoot);
  const ketchupDirName = config.ketchupDir ?? DEFAULT_KETCHUP_DIR;
  const ketchupDir = path.join(projectRoot, ketchupDirName);

  for (const subdir of CLAUDE_SYMLINK_DIRS) {
    const targetDir = path.join(claudeDir, subdir);
    removeSymlinksInDir(targetDir);
  }

  for (const subdir of KETCHUP_SYMLINK_DIRS) {
    const targetDir = path.join(ketchupDir, subdir);
    removeSymlinksInDir(targetDir);
  }
}

export function runPreuninstallSync(): void {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  const ketchupDir = path.join(projectRoot, DEFAULT_KETCHUP_DIR);

  for (const subdir of CLAUDE_SYMLINK_DIRS) {
    const targetDir = path.join(claudeDir, subdir);
    removeSymlinksInDir(targetDir);
  }

  for (const subdir of KETCHUP_SYMLINK_DIRS) {
    const targetDir = path.join(ketchupDir, subdir);
    removeSymlinksInDir(targetDir);
  }
}
