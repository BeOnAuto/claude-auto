import * as fs from 'node:fs';

import { debugLog } from '../debug-logger.js';
import {
  filterByHook,
  parseSkill,
  scanSkills,
  sortByPriority,
} from '../skills-loader.js';

type HookResult = {
  result: string;
};

export function handleUserPromptSubmit(
  claudeDir: string,
  userPrompt: string
): HookResult {
  const skillPaths = scanSkills(claudeDir);
  const skills = skillPaths.map((p) => parseSkill(fs.readFileSync(p, 'utf-8')));
  const filtered = filterByHook(skills, 'UserPromptSubmit');
  const sorted = sortByPriority(filtered);

  const reminders = sorted.map((s) => s.content).join('\n\n');

  debugLog(
    claudeDir,
    'user-prompt-submit',
    `injected ${sorted.length} reminder${sorted.length === 1 ? '' : 's'}`
  );

  if (reminders) {
    return {
      result: `${userPrompt}\n\n<system-reminder>\n${reminders}\n</system-reminder>`,
    };
  }

  return { result: userPrompt };
}
