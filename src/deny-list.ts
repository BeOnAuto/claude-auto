import * as fs from 'node:fs';
import * as path from 'node:path';

function loadFile(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export function loadDenyPatterns(dir: string): string[] {
  const projectPatterns = loadFile(path.join(dir, 'deny-list.project.txt'));
  const localPatterns = loadFile(path.join(dir, 'deny-list.local.txt'));

  return [...projectPatterns, ...localPatterns];
}
