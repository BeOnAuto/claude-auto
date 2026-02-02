import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { type ResolvedPaths, resolvePaths } from '../path-resolver.js';
import { loadReminders, scanReminders } from '../reminder-loader.js';

type HookResult = {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  };
};

export interface SessionStartDiagnostics {
  resolvedPaths: ResolvedPaths;
  reminderFiles: string[];
  matchedReminders: { name: string; priority: number }[];
}

export async function handleSessionStart(
  claudeDir: string,
  sessionId: string = '',
): Promise<HookResult & { diagnostics: SessionStartDiagnostics }> {
  const paths = await resolvePaths(claudeDir);
  const reminderFiles = scanReminders(paths.remindersDir);
  const reminders = loadReminders(paths.remindersDir, { hook: 'SessionStart' });

  activityLog(paths.ketchupDir, sessionId, 'session-start', `loaded ${reminders.length} reminders`);

  debugLog(paths.ketchupDir, 'session-start', `loaded ${reminders.length} reminders for SessionStart`);

  const content = reminders.map((r) => r.content).join('\n\n');

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: content,
    },
    diagnostics: {
      resolvedPaths: paths,
      reminderFiles,
      matchedReminders: reminders.map((r) => ({ name: r.name, priority: r.priority })),
    },
  };
}
