import * as path from 'node:path';

import { loadConfig } from '../config-loader.js';

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
  const ketchupDirName = config.ketchupDir ?? 'ketchup';

  const expectedFiles = getExpectedSymlinks(packageDir);

  const claudeSymlinks: SymlinkStatus[] = expectedFiles.claudeFiles.map((file) => ({
    path: file,
    status: 'ok',
  }));

  const ketchupSymlinks: SymlinkStatus[] = expectedFiles.ketchupFiles.map((file) => ({
    path: `${ketchupDirName}/${file}`,
    status: 'ok',
  }));

  return { symlinks: [...claudeSymlinks, ...ketchupSymlinks] };
}
