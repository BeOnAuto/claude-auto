import * as fs from 'node:fs';
import * as path from 'node:path';

export function findProjectRoot(): string {
  if (process.env.KETCHUP_ROOT) {
    const root = process.env.KETCHUP_ROOT;
    if (fs.existsSync(root)) {
      return path.resolve(root);
    }
  }
  if (process.env.INIT_CWD) {
    const initCwd = process.env.INIT_CWD;
    if (fs.existsSync(initCwd)) {
      return path.resolve(initCwd);
    }
  }
  return process.cwd();
}
