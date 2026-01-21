import * as fs from 'node:fs';

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
  }

  return validators;
}
