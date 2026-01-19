import * as fs from 'node:fs';
import * as path from 'node:path';

function walkUpToFind(startDir: string, marker: string): string | undefined {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  while (current !== root) {
    if (fs.existsSync(path.join(current, marker))) {
      return current;
    }
    current = path.dirname(current);
  }
  return undefined;
}

export function findProjectRoot(): string {
  if (process.env.KETCHUP_ROOT) {
    const root = process.env.KETCHUP_ROOT;
    if (fs.existsSync(root)) {
      return path.resolve(root);
    }
  }

  const startDir = process.env.INIT_CWD || process.cwd();
  if (!fs.existsSync(startDir)) {
    return process.cwd();
  }

  const packageRoot = walkUpToFind(startDir, 'package.json');
  if (packageRoot) {
    return packageRoot;
  }

  return process.cwd();
}
