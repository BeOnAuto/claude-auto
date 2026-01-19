import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { filterByHook, parseSkill, scanSkills } from './skills-loader.js';

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

  describe('parseSkill', () => {
    it('parses YAML frontmatter from skill content', () => {
      const content = `---
hook: SessionStart
priority: 10
mode: plan
---

# My Skill

Skill content here.`;

      const result = parseSkill(content);

      expect(result).toEqual({
        frontmatter: {
          hook: 'SessionStart',
          priority: 10,
          mode: 'plan',
        },
        content: '# My Skill\n\nSkill content here.',
      });
    });

    it('returns empty frontmatter when no frontmatter exists', () => {
      const content = '# Just Content\n\nNo frontmatter here.';

      const result = parseSkill(content);

      expect(result).toEqual({
        frontmatter: {},
        content: '# Just Content\n\nNo frontmatter here.',
      });
    });
  });

  describe('filterByHook', () => {
    it('filters skills by hook type', () => {
      const skills = [
        { frontmatter: { hook: 'SessionStart' }, content: 'A' },
        { frontmatter: { hook: 'PreToolUse' }, content: 'B' },
        { frontmatter: { hook: 'SessionStart' }, content: 'C' },
      ];

      const result = filterByHook(skills, 'SessionStart');

      expect(result).toEqual([
        { frontmatter: { hook: 'SessionStart' }, content: 'A' },
        { frontmatter: { hook: 'SessionStart' }, content: 'C' },
      ]);
    });

    it('returns empty array when no skills match hook', () => {
      const skills = [
        { frontmatter: { hook: 'PreToolUse' }, content: 'A' },
      ];

      const result = filterByHook(skills, 'SessionStart');

      expect(result).toEqual([]);
    });
  });
});
