import * as fs from 'node:fs';
import * as path from 'node:path';

import { createSymlink } from '../linker.js';

type RepairResult = {
  repaired: string[];
};

export function repair(packageDir: string, claudeDir: string, files: string[]): RepairResult {
  const repaired: string[] = [];

  for (const file of files) {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    const targetDir = path.dirname(target);

    fs.mkdirSync(targetDir, { recursive: true });
    createSymlink(source, target);
    repaired.push(file);
  }

  return { repaired };
}
