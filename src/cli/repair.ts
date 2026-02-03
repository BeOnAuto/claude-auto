import * as fs from 'node:fs';
import * as path from 'node:path';

import { DEFAULT_AUTO_DIR, loadConfig } from '../config-loader.js';
import { createSymlink } from '../linker.js';

type RepairResult = {
  repaired: string[];
};

interface ExpectedSymlinks {
  claudeFiles: string[];
  autoFiles: string[];
}

export function getExpectedSymlinks(packageDir: string): ExpectedSymlinks {
  const claudeDirs = ['commands'];
  const autoDirs = ['validators', 'reminders'];

  const claudeFiles: string[] = [];
  const autoFiles: string[] = [];

  for (const dir of claudeDirs) {
    const dirPath = path.join(packageDir, dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        claudeFiles.push(path.join(dir, entry));
      }
    }
  }

  for (const dir of autoDirs) {
    const dirPath = path.join(packageDir, '.claude-auto', dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        autoFiles.push(path.join(dir, entry));
      }
    }
  }

  return { claudeFiles, autoFiles };
}

export async function repair(packageDir: string, claudeDir: string, files: ExpectedSymlinks): Promise<RepairResult> {
  const projectRoot = path.dirname(claudeDir);
  const config = await loadConfig(projectRoot);
  const autoDirName = config.autoDir ?? DEFAULT_AUTO_DIR;
  const autoDir = path.join(projectRoot, autoDirName);

  const repaired: string[] = [];

  for (const file of files.claudeFiles) {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    const targetDir = path.dirname(target);

    fs.mkdirSync(targetDir, { recursive: true });
    createSymlink(source, target);
    repaired.push(file);
  }

  for (const file of files.autoFiles) {
    const source = path.join(packageDir, '.claude-auto', file);
    const target = path.join(autoDir, file);
    const targetDir = path.dirname(target);

    fs.mkdirSync(targetDir, { recursive: true });
    createSymlink(source, target);
    repaired.push(`${autoDirName}/${file}`);
  }

  return { repaired };
}
