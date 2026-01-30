import { runPostinstall } from '../postinstall.js';

export type InstallResult = {
  projectRoot: string;
  claudeDir: string;
  ketchupDir: string;
  symlinkedFiles: string[];
};

export async function install(packageDir?: string): Promise<InstallResult> {
  return runPostinstall(packageDir);
}
