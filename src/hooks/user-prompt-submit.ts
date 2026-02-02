import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { type ResolvedPaths, resolvePaths } from '../path-resolver.js';
import { loadReminders, scanReminders } from '../reminder-loader.js';

type HookResult = {
  result: string;
};

export interface UserPromptSubmitDiagnostics {
  resolvedPaths: ResolvedPaths;
  reminderFiles: string[];
  matchedReminders: { name: string; priority: number }[];
}

export async function handleUserPromptSubmit(
  claudeDir: string,
  sessionId: string,
  userPrompt: string,
): Promise<HookResult & { diagnostics: UserPromptSubmitDiagnostics }> {
  const paths = await resolvePaths(claudeDir);
  const reminderFiles = scanReminders(paths.remindersDir);
  const reminders = loadReminders(paths.remindersDir, { hook: 'UserPromptSubmit' });

  const reminderContent = reminders.map((r) => r.content).join('\n\n');

  activityLog(
    paths.ketchupDir,
    sessionId,
    'user-prompt-submit',
    `injected ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`,
  );

  debugLog(
    paths.ketchupDir,
    'user-prompt-submit',
    `injected ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`,
  );

  const diagnostics: UserPromptSubmitDiagnostics = {
    resolvedPaths: paths,
    reminderFiles,
    matchedReminders: reminders.map((r) => ({ name: r.name, priority: r.priority })),
  };

  if (reminderContent) {
    return {
      result: `${userPrompt}\n\n<system-reminder>\n${reminderContent}\n</system-reminder>`,
      diagnostics,
    };
  }

  return { result: userPrompt, diagnostics };
}
