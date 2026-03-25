import * as path from 'node:path';

import { getMainRepoPath, isWorktree } from './worktree-detector.js';

const AUTO_DIR = '.claude-auto';

export interface ResolvedPaths {
  projectRoot: string;
  claudeDir: string;
  autoDir: string;
  remindersDirs: string[];
  validatorsDirs: string[];
  isWorktree: boolean;
  mainRepoRoot: string | null;
}

export async function resolvePathsFromEnv(explicitPluginRoot?: string): Promise<ResolvedPaths> {
  const pluginRoot = explicitPluginRoot || process.env.CLAUDE_PLUGIN_ROOT;

  if (!pluginRoot) {
    throw new Error('CLAUDE_PLUGIN_ROOT must be set. Claude Auto requires plugin mode.');
  }

  const projectRoot = process.cwd();
  const worktreeDetected = isWorktree(projectRoot);
  const mainRepoRoot = worktreeDetected ? getMainRepoPath(projectRoot) : null;
  const claudeDir = path.join(projectRoot, '.claude');
  const autoDir = path.join(projectRoot, AUTO_DIR);

  return {
    projectRoot,
    claudeDir,
    autoDir,
    remindersDirs: [path.join(pluginRoot, 'reminders'), path.join(autoDir, 'reminders')],
    validatorsDirs: [path.join(pluginRoot, 'validators'), path.join(autoDir, 'validators')],
    isWorktree: worktreeDetected,
    mainRepoRoot,
  };
}
