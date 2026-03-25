import { activityLog } from '../activity-logger.js';
import { debugLog } from '../debug-logger.js';
import { createHookState } from '../hook-state.js';
import type { ResolvedPaths } from '../path-resolver.js';
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
  paths: ResolvedPaths,
  sessionId: string = '',
  agentType?: string,
): Promise<HookResult & { diagnostics: SessionStartDiagnostics }> {
  const reminderFiles = paths.remindersDirs.flatMap((dir) => scanReminders(dir));

  if (agentType === 'validator') {
    activityLog(paths.autoDir, sessionId, 'session-start', 'skipped reminders for validator session');
    debugLog(paths.autoDir, 'session-start', 'skipped reminders for validator session');

    return {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: '',
      },
      diagnostics: {
        resolvedPaths: paths,
        reminderFiles,
        matchedReminders: [],
      },
    };
  }

  const state = createHookState(paths.autoDir).read();
  const reminders = loadReminders(paths.remindersDirs, { hook: 'SessionStart' }, state.overrides.reminders);

  activityLog(paths.autoDir, sessionId, 'session-start', `loaded ${reminders.length} reminders`);
  debugLog(paths.autoDir, 'session-start', `loaded ${reminders.length} reminders for SessionStart`);

  const content = reminders.map((r) => r.content).join('\n\n');

  let finalContent = content;

  if (paths.isWorktree) {
    const worktreeContext = `\n\n# Worktree Context\n\nYou are operating in a git worktree. Main repository: ${paths.mainRepoRoot ?? 'unknown'}. All hooks and validators are active.`;
    finalContent = content ? `${content}${worktreeContext}` : worktreeContext.trimStart();
    debugLog(paths.autoDir, 'session-start', `injected worktree context (main repo: ${paths.mainRepoRoot})`);
  }

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: finalContent,
    },
    diagnostics: {
      resolvedPaths: paths,
      reminderFiles,
      matchedReminders: reminders.map((r) => ({ name: r.name, priority: r.priority })),
    },
  };
}
