import * as path from 'node:path';

const AUTO_DIR = '.claude-auto';

export interface ResolvedPaths {
  projectRoot: string;
  claudeDir: string;
  autoDir: string;
  remindersDirs: string[];
  validatorsDirs: string[];
}

export async function resolvePathsFromEnv(): Promise<ResolvedPaths> {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;

  if (!pluginRoot || !pluginData) {
    throw new Error('CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA must be set. Claude Auto requires plugin mode.');
  }

  const projectRoot = process.cwd();
  const claudeDir = path.join(projectRoot, '.claude');
  const autoDir = path.join(projectRoot, AUTO_DIR);

  return {
    projectRoot,
    claudeDir,
    autoDir,
    remindersDirs: [path.join(pluginRoot, 'reminders'), path.join(autoDir, 'reminders')],
    validatorsDirs: [path.join(pluginRoot, 'validators'), path.join(autoDir, 'validators')],
  };
}
