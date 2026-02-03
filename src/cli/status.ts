import * as path from 'node:path';

import { DEFAULT_AUTO_DIR, loadConfig } from '../config-loader.js';

import { getExpectedSymlinks } from './repair.js';

type SymlinkStatus = {
  path: string;
  status: 'ok';
};

type StatusResult = {
  symlinks: SymlinkStatus[];
};

export async function getStatus(packageDir: string, claudeDir: string): Promise<StatusResult> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);
  const autoDirName = config.autoDir ?? DEFAULT_AUTO_DIR;

  const expectedFiles = getExpectedSymlinks(packageDir);

  const claudeSymlinks: SymlinkStatus[] = expectedFiles.claudeFiles.map((file) => ({
    path: file,
    status: 'ok',
  }));

  const autoSymlinks: SymlinkStatus[] = expectedFiles.autoFiles.map((file) => ({
    path: `${autoDirName}/${file}`,
    status: 'ok',
  }));

  return { symlinks: [...claudeSymlinks, ...autoSymlinks] };
}
