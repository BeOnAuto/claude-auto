import * as fs from 'node:fs';
import * as path from 'node:path';

import { loadConfig } from './config-loader.js';
import { generateGitignore } from './gitignore-manager.js';
import { createSymlink, getPackageDir } from './linker.js';
import { findProjectRoot } from './root-finder.js';
import { mergeSettings } from './settings-merger.js';

const CLAUDE_SYMLINK_DIRS = [
  { name: 'scripts', sourcePath: 'dist/scripts', filter: (f: string) => f.endsWith('.js') },
  { name: 'commands', sourcePath: 'commands' },
];

const KETCHUP_SYMLINK_DIRS = [
  { name: 'validators', sourcePath: 'validators' },
  { name: 'reminders', sourcePath: 'reminders' },
];

export interface PostinstallResult {
  projectRoot: string;
  claudeDir: string;
  ketchupDir: string;
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

export async function runPostinstall(packageDir?: string): Promise<PostinstallResult> {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });

  const pkgDir = packageDir ?? getPackageDir();
  const symlinkedFiles: string[] = [];

  // Load config to get ketchupDir setting
  const config = await loadConfig(projectRoot);
  const ketchupDirName = config.ketchupDir ?? 'ketchup';
  const ketchupDir = path.join(projectRoot, ketchupDirName);
  fs.mkdirSync(ketchupDir, { recursive: true });

  // Symlink scripts and commands to .claude
  for (const { name, sourcePath, filter } of CLAUDE_SYMLINK_DIRS) {
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

  // Symlink validators and reminders to ketchup dir
  for (const { name, sourcePath } of KETCHUP_SYMLINK_DIRS) {
    const sourceDir = path.join(pkgDir, sourcePath);
    const targetDir = path.join(ketchupDir, name);
    const files = collectFiles(sourceDir);
    if (files.length > 0) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    for (const file of files) {
      const source = path.join(sourceDir, file);
      const target = path.join(targetDir, file);
      createSymlink(source, target);
      symlinkedFiles.push(`${ketchupDirName}/${name}/${file}`);
    }
  }

  generateGitignore(claudeDir, symlinkedFiles);
  mergeSettings(pkgDir, claudeDir);

  return { projectRoot, claudeDir, ketchupDir, symlinkedFiles };
}
