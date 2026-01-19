import * as fs from 'node:fs';
import * as path from 'node:path';

import yaml from 'yaml';

type SkillFrontmatter = Record<string, unknown>;

type ParsedSkill = {
  frontmatter: SkillFrontmatter;
  content: string;
};

export function filterByHook(skills: ParsedSkill[], hookType: string): ParsedSkill[] {
  return skills.filter((skill) => skill.frontmatter.hook === hookType);
}

export function filterByMode(skills: ParsedSkill[], mode: string): ParsedSkill[] {
  return skills.filter((skill) => !skill.frontmatter.mode || skill.frontmatter.mode === mode);
}

type State = Record<string, unknown>;

export function filterByState(skills: ParsedSkill[], state: State): ParsedSkill[] {
  return skills.filter((skill) => {
    const when = skill.frontmatter.when as Record<string, unknown> | undefined;
    if (!when) {
      return true;
    }
    return Object.entries(when).every(([key, value]) => state[key] === value);
  });
}

export function parseSkill(raw: string): ParsedSkill {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, content: raw };
  }

  const frontmatter = yaml.parse(frontmatterMatch[1]) as SkillFrontmatter;
  const content = frontmatterMatch[2];

  return { frontmatter, content };
}

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
