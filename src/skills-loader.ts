import * as fs from 'node:fs';
import * as path from 'node:path';

import yaml from 'yaml';

type SkillFrontmatter = Record<string, unknown>;

type ParsedSkill = {
  frontmatter: SkillFrontmatter;
  content: string;
};

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
