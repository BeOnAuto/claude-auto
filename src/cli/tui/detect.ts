import fs from 'node:fs';
import path from 'node:path';

export function isAutoConfigured(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.ketchup', '.claude.hooks.json'));
}
