import * as fs from 'node:fs';
import * as path from 'node:path';

export function findProjectRoot(): string {
  if (process.env.KETCHUP_ROOT) {
    const root = process.env.KETCHUP_ROOT;
    if (fs.existsSync(root)) {
      return path.resolve(root);
    }
  }
  return process.cwd();
}
