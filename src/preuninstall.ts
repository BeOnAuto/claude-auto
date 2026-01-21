import * as fs from 'node:fs';
import * as path from 'node:path';

import { removeSymlink } from './linker.js';
import { findProjectRoot } from './root-finder.js';

const SYMLINK_DIRS = ['scripts', 'commands', 'validators', 'reminders'];

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

export function runPreuninstall(): void {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');

  for (const subdir of SYMLINK_DIRS) {
    const targetDir = path.join(claudeDir, subdir);
    removeSymlinksInDir(targetDir);
  }
}
