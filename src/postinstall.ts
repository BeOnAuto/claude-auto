import * as fs from 'node:fs';
import * as path from 'node:path';

import { generateGitignore } from './gitignore-manager.js';
import { createSymlink, getPackageDir } from './linker.js';
import { findProjectRoot } from './root-finder.js';
import { mergeSettings } from './settings-merger.js';

const SYMLINK_DIRS = [
  { name: 'scripts', sourcePath: 'dist/scripts', filter: (f: string) => f.endsWith('.js') },
  { name: 'skills', sourcePath: 'skills' },
  { name: 'commands', sourcePath: 'commands' },
];

export interface PostinstallResult {
  projectRoot: string;
  claudeDir: string;
  symlinkedFiles: string[];
}

function collectFiles(dir: string, filter?: (filename: string) => boolean): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && (!filter || filter(entry.name))) {
      files.push(entry.name);
    }
  }
  return files;
}

export function runPostinstall(packageDir?: string): PostinstallResult {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });

  const pkgDir = packageDir ?? getPackageDir();
  const symlinkedFiles: string[] = [];

  for (const { name, sourcePath, filter } of SYMLINK_DIRS) {
    const sourceDir = path.join(pkgDir, sourcePath);
    const targetDir = path.join(claudeDir, name);
    const files = collectFiles(sourceDir, filter);
    if (files.length > 0) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    for (const file of files) {
      const source = path.join(sourceDir, file);
      const target = path.join(targetDir, file);
      createSymlink(source, target);
      symlinkedFiles.push(`${name}/${file}`);
    }
  }

  generateGitignore(claudeDir, symlinkedFiles);
  mergeSettings(pkgDir, claudeDir);

  return { projectRoot, claudeDir, symlinkedFiles };
}
