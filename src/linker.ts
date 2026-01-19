import * as path from 'node:path';

export function getPackageDir(): string {
  return path.resolve(__dirname, '..');
}
