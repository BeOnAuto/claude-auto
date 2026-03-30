import * as fs from 'node:fs';
import * as path from 'node:path';

export function isWorktree(cwd?: string): boolean {
  const dir = cwd ?? process.cwd();
  const gitPath = path.join(dir, '.git');
  try {
    const stat = fs.statSync(gitPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export function getMainRepoPath(cwd?: string): string | null {
  const dir = cwd ?? process.cwd();
  if (!isWorktree(dir)) {
    return null;
  }
  const gitContent = fs.readFileSync(path.join(dir, '.git'), 'utf-8').trim();
  const gitdir = gitContent.replace(/^gitdir:\s*/, '');
  return path.resolve(gitdir, '..', '..', '..');
}
