import * as path from 'node:path';

import { loadConfig, type KetchupConfig } from './config-loader.js';

export interface ResolvedPaths {
  projectRoot: string;
  claudeDir: string;
  ketchupDir: string;
  remindersDir: string;
  validatorsDir: string;
}

export async function resolvePaths(claudeDir: string): Promise<ResolvedPaths> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);

  const ketchupDirName = config.ketchupDir ?? 'ketchup';
  const ketchupDir = path.join(projectRoot, ketchupDirName);

  return {
    projectRoot,
    claudeDir,
    ketchupDir,
    remindersDir: path.join(ketchupDir, 'reminders'),
    validatorsDir: path.join(ketchupDir, 'validators'),
  };
}

export function resolvePathsSync(claudeDir: string, config: KetchupConfig): ResolvedPaths {
  const projectRoot = path.dirname(claudeDir);
  const ketchupDirName = config.ketchupDir ?? 'ketchup';
  const ketchupDir = path.join(projectRoot, ketchupDirName);

  return {
    projectRoot,
    claudeDir,
    ketchupDir,
    remindersDir: path.join(ketchupDir, 'reminders'),
    validatorsDir: path.join(ketchupDir, 'validators'),
  };
}
