import * as path from 'node:path';

import { verifySymlink } from '../linker.js';

import { getExpectedSymlinks } from './repair.js';

type DoctorResult = {
  healthy: boolean;
  issues: string[];
};

export function doctor(packageDir: string, claudeDir: string): DoctorResult {
  const expectedFiles = getExpectedSymlinks(packageDir);

  const allValid = expectedFiles.every((file) => {
    const source = path.join(packageDir, file);
    const target = path.join(claudeDir, file);
    return verifySymlink(target, source);
  });

  return {
    healthy: allValid,
    issues: [],
  };
}
