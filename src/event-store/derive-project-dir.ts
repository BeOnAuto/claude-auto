import { homedir } from 'node:os';

export function deriveProjectDir(cwd: string): string {
  return `${homedir()}/.claude/projects/${cwd.replaceAll('/', '-')}`;
}
