import { debugLog } from '../debug-logger.js';
import { loadReminders } from '../reminder-loader.js';

type HookResult = {
  result: string;
};

export function handleSessionStart(claudeDir: string): HookResult {
  const reminders = loadReminders(claudeDir, { hook: 'SessionStart' });

  debugLog(
    claudeDir,
    'session-start',
    `loaded ${reminders.length} reminders for SessionStart`
  );

  const content = reminders.map((r) => r.content).join('\n\n');

  return { result: content };
}
