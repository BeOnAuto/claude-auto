import * as fs from 'node:fs';
import * as path from 'node:path';

export function getPackageDir(): string {
  return path.resolve(__dirname, '..');
}

export function isLinkedMode(packagePath: string): boolean {
  return fs.lstatSync(packagePath).isSymbolicLink();
}
