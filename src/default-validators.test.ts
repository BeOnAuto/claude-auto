import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadValidators } from './validator-loader.js';

describe('default validators', () => {
  const validatorsDir = path.resolve(__dirname, '..', 'validators');

  it('ketchup-rules.md exists and is a valid enabled validator', () => {
    const validators = loadValidators([validatorsDir]);
    const ketchupRules = validators.find((v) => v.name === 'ketchup-rules');

    expect(ketchupRules).toEqual({
      name: 'ketchup-rules',
      description: expect.any(String),
      enabled: true,
      content: expect.stringContaining('CLAUDE.md'),
      path: path.join(validatorsDir, 'ketchup-rules.md'),
    });
  });

  it('no-dangerous-git.md exists and is a valid enabled validator', () => {
    const validators = loadValidators([validatorsDir]);
    const noDangerousGit = validators.find((v) => v.name === 'no-dangerous-git');

    expect(noDangerousGit).toEqual({
      name: 'no-dangerous-git',
      description: expect.any(String),
      enabled: true,
      content: expect.stringContaining('--force'),
      path: path.join(validatorsDir, 'no-dangerous-git.md'),
    });
  });
});
