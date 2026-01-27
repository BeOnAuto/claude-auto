import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { resolvePaths } from '../path-resolver.js';
import { loadReminders } from '../reminder-loader.js';

type HookResult = {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  }
}

export async function handleSessionStart(claudeDir: string, sessionId: string = ''): Promise<HookResult> {
  const paths = await resolvePaths(claudeDir);
  const reminders = loadReminders(paths.remindersDir, { hook: 'SessionStart' });

  activityLog(claudeDir, sessionId, 'session-start', `loaded ${reminders.length} reminders`);

  debugLog(claudeDir, 'session-start', `loaded ${reminders.length} reminders for SessionStart`);

  const content = reminders.map((r) => r.content).join('\n\n');

  return {
    "hookSpecificOutput": {
      "hookEventName": "SessionStart",
      "additionalContext": content
    }
  }
}
