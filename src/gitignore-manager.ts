import * as fs from 'node:fs';
import * as path from 'node:path';

const RUNTIME_PATTERNS = ['*.local.*', 'state.json', 'logs/'];

export function generateGitignore(targetDir: string, symlinkedFiles: string[]): void {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const lines: string[] = [...symlinkedFiles, ...RUNTIME_PATTERNS];
  fs.writeFileSync(gitignorePath, lines.join('\n'));
}
