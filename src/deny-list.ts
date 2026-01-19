import * as fs from 'node:fs';
import * as path from 'node:path';

export function loadDenyPatterns(dir: string): string[] {
  const projectFile = path.join(dir, 'deny-list.project.txt');

  if (!fs.existsSync(projectFile)) {
    return [];
  }

  const content = fs.readFileSync(projectFile, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}
