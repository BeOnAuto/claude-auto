import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scanSkills } from './skills-loader.js';

describe('skills-loader', () => {
  describe('scanSkills', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-skills-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns empty array when no skills directory exists', () => {
      const result = scanSkills(tempDir);

      expect(result).toEqual([]);
    });

    it('finds markdown files in skills directory', () => {
      const skillsDir = path.join(tempDir, 'skills');
      fs.mkdirSync(skillsDir, { recursive: true });
      fs.writeFileSync(path.join(skillsDir, 'skill-a.md'), '# Skill A');
      fs.writeFileSync(path.join(skillsDir, 'skill-b.md'), '# Skill B');

      const result = scanSkills(tempDir);

      expect(result).toEqual([
        path.join(skillsDir, 'skill-a.md'),
        path.join(skillsDir, 'skill-b.md'),
      ]);
    });

    it('ignores non-markdown files', () => {
      const skillsDir = path.join(tempDir, 'skills');
      fs.mkdirSync(skillsDir, { recursive: true });
      fs.writeFileSync(path.join(skillsDir, 'skill.md'), '# Skill');
      fs.writeFileSync(path.join(skillsDir, 'readme.txt'), 'readme');

      const result = scanSkills(tempDir);

      expect(result).toEqual([path.join(skillsDir, 'skill.md')]);
    });
  });
});
