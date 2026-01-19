import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseSkill, scanSkills } from '../skills-loader.js';

type SkillInfo = {
  name: string;
  hook: string;
  priority: number;
};

type SkillsResult = {
  skills: SkillInfo[];
};

export function listSkills(claudeDir: string): SkillsResult {
  const skillPaths = scanSkills(claudeDir);
  const skills: SkillInfo[] = skillPaths.map((skillPath) => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const parsed = parseSkill(content);
    return {
      name: path.basename(skillPath),
      hook: parsed.frontmatter.hook as string,
      priority: (parsed.frontmatter.priority as number) ?? 0,
    };
  });

  return { skills };
}
