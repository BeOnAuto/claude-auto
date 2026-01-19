import * as fs from 'node:fs';
import * as path from 'node:path';

type SymlinkStatus = {
  path: string;
  status: 'ok';
};

type StatusResult = {
  symlinks: SymlinkStatus[];
};

function getExpectedSymlinks(packageDir: string): string[] {
  const dirs = ['scripts', 'skills', 'commands'];
  const files: string[] = [];

  for (const dir of dirs) {
    const dirPath = path.join(packageDir, dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        files.push(path.join(dir, entry));
      }
    }
  }

  return files;
}

export function getStatus(packageDir: string): StatusResult {
  const expectedFiles = getExpectedSymlinks(packageDir);

  const symlinks: SymlinkStatus[] = expectedFiles.map((file) => {
    return {
      path: file,
      status: 'ok',
    };
  });

  return { symlinks };
}
