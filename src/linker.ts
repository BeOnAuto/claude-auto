import * as fs from 'node:fs';
import * as path from 'node:path';

export function getPackageDir(): string {
  return path.resolve(__dirname, '..');
}

export function isLinkedMode(packagePath: string): boolean {
  return fs.lstatSync(packagePath).isSymbolicLink();
}

export function createSymlink(source: string, target: string): void {
  if (fs.existsSync(target)) {
    const stats = fs.lstatSync(target);
    if (stats.isSymbolicLink()) {
      if (fs.readlinkSync(target) === source) {
        return;
      }
      fs.unlinkSync(target);
    } else {
      fs.renameSync(target, `${target}.backup`);
    }
  }
  fs.symlinkSync(source, target);
}

export function removeSymlink(target: string): void {
  if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) {
    fs.unlinkSync(target);
  }
}
