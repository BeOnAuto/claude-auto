import * as path from 'node:path';

import { DEFAULT_AUTO_DIR, loadConfig } from './config-loader.js';

export interface ResolvedPaths {
  projectRoot: string;
  claudeDir: string;
  autoDir: string;
  remindersDir: string;
  validatorsDir: string;
}

export function resolveClaudeDirFromScript(scriptDir: string): string {
  const projectRoot = path.resolve(scriptDir, '..', '..');
  return path.join(projectRoot, '.claude');
}

export async function resolvePaths(claudeDir: string): Promise<ResolvedPaths> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);

  const autoDirName = config.autoDir ?? DEFAULT_AUTO_DIR;
  const autoDir = path.join(projectRoot, autoDirName);

  return {
    projectRoot,
    claudeDir,
    autoDir,
    remindersDir: path.join(autoDir, 'reminders'),
    validatorsDir: path.join(autoDir, 'validators'),
  };
}
