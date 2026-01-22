import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { loadReminders } from '../reminder-loader.js';

type HookResult = {
  result: string;
};

export function handleSessionStart(
  claudeDir: string,
  sessionId: string = ''
): HookResult {
  const reminders = loadReminders(claudeDir, { hook: 'SessionStart' });

  activityLog(
    claudeDir,
    sessionId,
    'session-start',
    `loaded ${reminders.length} reminders`
  );

  debugLog(
    claudeDir,
    'session-start',
    `loaded ${reminders.length} reminders for SessionStart`
  );

  const content = reminders.map((r) => r.content).join('\n\n');

  return { result: content };
}
