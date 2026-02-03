import * as path from 'node:path';

import { DEFAULT_AUTO_DIR, loadConfig } from '../config-loader.js';
import { verifySymlink } from '../linker.js';

import { getExpectedSymlinks } from './repair.js';

type DoctorResult = {
  healthy: boolean;
  issues: string[];
};

export async function doctor(packageDir: string, claudeDir: string): Promise<DoctorResult> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);
  const autoDirName = config.autoDir ?? DEFAULT_AUTO_DIR;
  const autoDir = path.join(projectRoot, autoDirName);

  const expectedFiles = getExpectedSymlinks(packageDir);
  const issues: string[] = [];

  for (const file of expectedFiles.claudeFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    if (!verifySymlink(target, source)) {
      issues.push(`Missing or invalid symlink: ${target}`);
    }
  }

  for (const file of expectedFiles.autoFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(autoDir, file);
    if (!verifySymlink(target, source)) {
      issues.push(`Missing or invalid symlink: ${target}`);
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}
