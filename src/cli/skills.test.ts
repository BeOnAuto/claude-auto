import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listSkills } from './skills.js';

describe('cli skills', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-skills-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('lists skills with their metadata', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'coding.md'),
      `---
hook: SessionStart
priority: 10
---

Follow coding standards.`
    );

    const result = listSkills(tempDir);

    expect(result).toEqual({
      skills: [
        {
          name: 'coding.md',
          hook: 'SessionStart',
          priority: 10,
        },
      ],
    });
  });
});
