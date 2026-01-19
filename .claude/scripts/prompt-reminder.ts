#!/usr/bin/env tsx

// UserPromptSubmit hook: reminds Claude to check CLAUDE.md and stick to the plan.

import { readFileSync } from 'fs';
import { logError, setSessionId } from './lib/logger.js';

interface HookInput {
  prompt?: string;
  session_id?: string;
}

try {
  const stdin = readFileSync(0, 'utf8').trim();
  if (!stdin) {
    process.exit(0);
  }
  const data: HookInput = JSON.parse(stdin);
  setSessionId(data.session_id);

  // Return additional context to remind Claude
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `REMINDER: Before proceeding, ensure you:
1. Have read and are following CLAUDE.md guidelines
2. Are sticking to the ketchup-plan.md if one exists
3. Are working in controlled bursts (one test, one commit)
4. Will ask before assuming backwards compatibility is needed`
    }
  }));

} catch (error) {
  logError(error, 'prompt-reminder');
  process.exit(0);
}
