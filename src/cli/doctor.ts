import * as path from 'node:path';

import { DEFAULT_KETCHUP_DIR, loadConfig } from '../config-loader.js';
import { verifySymlink } from '../linker.js';

import { getExpectedSymlinks } from './repair.js';

type DoctorResult = {
  healthy: boolean;
  issues: string[];
};

export async function doctor(packageDir: string, claudeDir: string): Promise<DoctorResult> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);
  const ketchupDirName = config.ketchupDir ?? DEFAULT_KETCHUP_DIR;
  const ketchupDir = path.join(projectRoot, ketchupDirName);

  const expectedFiles = getExpectedSymlinks(packageDir);
  const issues: string[] = [];

  for (const file of expectedFiles.claudeFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    if (!verifySymlink(target, source)) {
      issues.push(`Missing or invalid symlink: ${target}`);
    }
  }

  for (const file of expectedFiles.ketchupFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(ketchupDir, file);
    if (!verifySymlink(target, source)) {
      issues.push(`Missing or invalid symlink: ${target}`);
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}
