import * as fs from 'node:fs';
import * as path from 'node:path';

import matter from 'gray-matter';

export interface Validator {
  name: string;
  description: string;
  enabled: boolean;
  content: string;
  path: string;
}

export function loadValidators(dirs: string[]): Validator[] {
  const validators: Validator[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(dir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      validators.push({
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        content: content.trim(),
        path: filePath,
      });
    }
  }

  return validators;
}
