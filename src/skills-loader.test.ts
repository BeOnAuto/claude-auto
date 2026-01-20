import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  filterByHook,
  filterByMode,
  filterByState,
  parseSkill,
  scanSkills,
  sortByPriority,
} from './skills-loader.js';

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

  describe('filterByMode', () => {
    it('filters skills by mode', () => {
      const skills = [
        { frontmatter: { mode: 'plan' }, content: 'A' },
        { frontmatter: { mode: 'code' }, content: 'B' },
        { frontmatter: { mode: 'plan' }, content: 'C' },
      ];

      const result = filterByMode(skills, 'plan');

      expect(result).toEqual([
        { frontmatter: { mode: 'plan' }, content: 'A' },
        { frontmatter: { mode: 'plan' }, content: 'C' },
      ]);
    });

    it('includes skills with no mode specified', () => {
      const skills = [
        { frontmatter: { mode: 'plan' }, content: 'A' },
        { frontmatter: {}, content: 'B' },
      ];

      const result = filterByMode(skills, 'plan');

      expect(result).toEqual([
        { frontmatter: { mode: 'plan' }, content: 'A' },
        { frontmatter: {}, content: 'B' },
      ]);
    });
  });

  describe('filterByState', () => {
    it('filters skills by state conditions', () => {
      const skills = [
        { frontmatter: { when: { counter: 5 } }, content: 'A' },
        { frontmatter: { when: { counter: 10 } }, content: 'B' },
      ];
      const state = { counter: 5 };

      const result = filterByState(skills, state);

      expect(result).toEqual([
        { frontmatter: { when: { counter: 5 } }, content: 'A' },
      ]);
    });

    it('includes skills with no when condition', () => {
      const skills = [
        { frontmatter: { when: { counter: 5 } }, content: 'A' },
        { frontmatter: {}, content: 'B' },
      ];
      const state = { counter: 10 };

      const result = filterByState(skills, state);

      expect(result).toEqual([{ frontmatter: {}, content: 'B' }]);
    });

    it('matches when all conditions are satisfied', () => {
      const skills = [
        { frontmatter: { when: { a: 1, b: 2 } }, content: 'A' },
      ];
      const state = { a: 1, b: 2, c: 3 };

      const result = filterByState(skills, state);

      expect(result).toEqual([
        { frontmatter: { when: { a: 1, b: 2 } }, content: 'A' },
      ]);
    });
  });

  describe('sortByPriority', () => {
    it('sorts skills by priority descending', () => {
      const skills = [
        { frontmatter: { priority: 5 }, content: 'A' },
        { frontmatter: { priority: 10 }, content: 'B' },
        { frontmatter: { priority: 1 }, content: 'C' },
      ];

      const result = sortByPriority(skills);

      expect(result).toEqual([
        { frontmatter: { priority: 10 }, content: 'B' },
        { frontmatter: { priority: 5 }, content: 'A' },
        { frontmatter: { priority: 1 }, content: 'C' },
      ]);
    });

    it('treats missing priority as 0', () => {
      const skills = [
        { frontmatter: {}, content: 'A' },
        { frontmatter: { priority: 5 }, content: 'B' },
        { frontmatter: { priority: -1 }, content: 'C' },
      ];

      const result = sortByPriority(skills);

      expect(result).toEqual([
        { frontmatter: { priority: 5 }, content: 'B' },
        { frontmatter: {}, content: 'A' },
        { frontmatter: { priority: -1 }, content: 'C' },
      ]);
    });

    it('sorts skills with both priorities undefined as equal', () => {
      const skills = [
        { frontmatter: {}, content: 'First' },
        { frontmatter: {}, content: 'Second' },
      ];

      const result = sortByPriority(skills);

      expect(result).toEqual([
        { frontmatter: {}, content: 'First' },
        { frontmatter: {}, content: 'Second' },
      ]);
    });
  });
});
