import * as fs from 'node:fs';
import * as path from 'node:path';

export function generateGitignore(
  targetDir: string,
  symlinkedFiles: string[]
): void {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const lines: string[] = [];

  for (const file of symlinkedFiles) {
    lines.push(file);
  }

  lines.push('*.local.*');

  fs.writeFileSync(gitignorePath, lines.join('\n'));
}
