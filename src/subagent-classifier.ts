export type SubagentType = 'explore' | 'work' | 'unknown';

const EXPLORE_PATTERNS = [
  /\bsearch\b/i,
  /\bfind\b/i,
  /\bunderstand\b/i,
  /\binvestigate\b/i,
  /\banalyze\b/i,
  /\blook\s+for\b/i,
  /\bresearch\b/i,
  /\bexplore\b/i,
  /\bdiscover\b/i,
  /\blocate\b/i,
];

const WORK_PATTERNS = [
  /\bimplement\b/i,
  /\bcreate\b/i,
  /\bwrite\b/i,
  /\bfix\b/i,
  /\brefactor\b/i,
  /\bupdate\b/i,
  /\badd\b/i,
  /\bbuild\b/i,
  /\bmodify\b/i,
  /\bchange\b/i,
  /\bremove\b/i,
  /\bdelete\b/i,
];

export function classifySubagent(taskDescription: string): SubagentType {
  if (!taskDescription) {
    return 'unknown';
  }

  const isExplore = EXPLORE_PATTERNS.some((p) => p.test(taskDescription));
  const isWork = WORK_PATTERNS.some((p) => p.test(taskDescription));

  if (isExplore && !isWork) {
    return 'explore';
  }
  if (isWork && !isExplore) {
    return 'work';
  }

  return 'unknown';
}

const TASK_DESCRIPTION_PATTERN =
  /<invoke name="Task">[\s\S]*?<parameter name="description">(.+?)<\/parameter>/;

export function extractTaskDescription(transcript: string): string | undefined {
  if (!transcript) {
    return undefined;
  }

  const match = transcript.match(TASK_DESCRIPTION_PATTERN);
  return match?.[1];
}
