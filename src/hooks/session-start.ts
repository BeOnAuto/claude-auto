import * as fs from 'node:fs';

import {
  filterByHook,
  parseSkill,
  scanSkills,
  sortByPriority,
} from '../skills-loader.js';

type HookResult = {
  result: string;
};

export function handleSessionStart(claudeDir: string): HookResult {
  const skillPaths = scanSkills(claudeDir);
  const skills = skillPaths.map((p) => parseSkill(fs.readFileSync(p, 'utf-8')));
  const filtered = filterByHook(skills, 'SessionStart');
  const sorted = sortByPriority(filtered);

  const content = sorted.map((s) => s.content).join('\n\n');

  return { result: content };
}
