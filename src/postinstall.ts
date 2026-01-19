import * as fs from 'node:fs';
import * as path from 'node:path';

import { findProjectRoot } from './root-finder.js';

export interface PostinstallResult {
  projectRoot: string;
  claudeDir: string;
}

export function runPostinstall(): PostinstallResult {
  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  return { projectRoot, claudeDir };
}
