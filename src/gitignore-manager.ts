import * as fs from 'node:fs';
import * as path from 'node:path';

export function generateGitignore(targetDir: string): void {
  const gitignorePath = path.join(targetDir, '.gitignore');
  fs.writeFileSync(gitignorePath, '');
}
