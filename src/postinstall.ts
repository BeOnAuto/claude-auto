import { findProjectRoot } from './root-finder.js';

export interface PostinstallResult {
  projectRoot: string;
}

export function runPostinstall(): PostinstallResult {
  const projectRoot = findProjectRoot();
  return { projectRoot };
}
