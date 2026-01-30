import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { runPostinstall } from '../postinstall.js';
import { findProjectRoot } from '../root-finder.js';

export type InstallResult = {
  projectRoot: string;
  claudeDir: string;
  ketchupDir: string;
  symlinkedFiles: string[];
  addedDependency: boolean;
};

function detectPackageManager(projectRoot: string): 'pnpm' | 'yarn' | 'npm' {
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

function getPackageVersion(): string {
  const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'latest';
  }
  return 'latest';
}

function isAlreadyInstalled(projectRoot: string): boolean {
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return false;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  return !!(pkg.devDependencies?.['claude-ketchup'] || pkg.dependencies?.['claude-ketchup']);
}

export async function install(packageDir?: string): Promise<InstallResult> {
  const projectRoot = findProjectRoot();
  let addedDependency = false;

  // Add claude-ketchup as a devDependency if not already installed
  if (!isAlreadyInstalled(projectRoot)) {
    const pm = detectPackageManager(projectRoot);
    const version = getPackageVersion();
    const pkg = `claude-ketchup@${version}`;

    let cmd: string;
    switch (pm) {
      case 'pnpm':
        cmd = `pnpm add -D ${pkg}`;
        break;
      case 'yarn':
        cmd = `yarn add -D ${pkg}`;
        break;
      default:
        cmd = `npm install --save-dev ${pkg}`;
    }

    execSync(cmd, { cwd: projectRoot, stdio: 'inherit' });
    addedDependency = true;
  }

  const result = await runPostinstall(packageDir);
  return { ...result, addedDependency };
}
