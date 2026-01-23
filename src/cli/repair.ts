import * as fs from 'node:fs';
import * as path from 'node:path';

import { DEFAULT_KETCHUP_DIR, loadConfig } from '../config-loader.js';
import { createSymlink } from '../linker.js';

type RepairResult = {
  repaired: string[];
};

interface ExpectedSymlinks {
  claudeFiles: string[];
  ketchupFiles: string[];
}

export function getExpectedSymlinks(packageDir: string): ExpectedSymlinks {
  const claudeDirs = ['scripts', 'commands'];
  const ketchupDirs = ['validators', 'reminders'];

  const claudeFiles: string[] = [];
  const ketchupFiles: string[] = [];

  for (const dir of claudeDirs) {
    const dirPath = path.join(packageDir, dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        claudeFiles.push(path.join(dir, entry));
      }
    }
  }

  for (const dir of ketchupDirs) {
    const dirPath = path.join(packageDir, dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        ketchupFiles.push(path.join(dir, entry));
      }
    }
  }

  return { claudeFiles, ketchupFiles };
}

export async function repair(packageDir: string, claudeDir: string, files: ExpectedSymlinks): Promise<RepairResult> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);
  const ketchupDirName = config.ketchupDir ?? DEFAULT_KETCHUP_DIR;
  const ketchupDir = path.join(projectRoot, ketchupDirName);

  const repaired: string[] = [];

  for (const file of files.claudeFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    const targetDir = path.dirname(target);

    fs.mkdirSync(targetDir, { recursive: true });
    createSymlink(source, target);
    repaired.push(file);
  }

  for (const file of files.ketchupFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(ketchupDir, file);
    const targetDir = path.dirname(target);

    fs.mkdirSync(targetDir, { recursive: true });
    createSymlink(source, target);
    repaired.push(`${ketchupDirName}/${file}`);
  }

  return { repaired };
}
