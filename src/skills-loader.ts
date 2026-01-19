import * as fs from 'node:fs';
import * as path from 'node:path';

export function scanSkills(dir: string): string[] {
  const skillsDir = path.join(dir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const files = fs.readdirSync(skillsDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(skillsDir, file))
    .sort();
}
