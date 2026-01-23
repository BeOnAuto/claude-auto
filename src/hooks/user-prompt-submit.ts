import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { resolvePaths } from '../path-resolver.js';
import { loadReminders } from '../reminder-loader.js';

type HookResult = {
  result: string;
};

export async function handleUserPromptSubmit(
  claudeDir: string,
  sessionId: string,
  userPrompt: string,
): Promise<HookResult> {
  const paths = await resolvePaths(claudeDir);
  const reminders = loadReminders(paths.remindersDir, { hook: 'UserPromptSubmit' });

  const reminderContent = reminders.map((r) => r.content).join('\n\n');

  activityLog(
    claudeDir,
    sessionId,
    'user-prompt-submit',
    `injected ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`,
  );

  debugLog(
    claudeDir,
    'user-prompt-submit',
    `injected ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`,
  );

  if (reminderContent) {
    return {
      result: `${userPrompt}\n\n<system-reminder>\n${reminderContent}\n</system-reminder>`,
    };
  }

  return { result: userPrompt };
}
