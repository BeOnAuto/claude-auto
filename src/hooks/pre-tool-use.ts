import { activityLog } from '../activity-logger.js';
import { type Executor, getCommitContext, isCommitCommand, validateCommit } from '../commit-validator.js';
import { debugLog } from '../debug-logger.js';
import { isDenied, loadDenyPatterns } from '../deny-list.js';
import { resolvePaths } from '../path-resolver.js';
import { loadReminders } from '../reminder-loader.js';
import { loadValidators } from '../validator-loader.js';

type ToolInput = Record<string, unknown>;

type HookResult = {
  decision: 'block' | 'allow';
  reason?: string;
  result?: string;
};

interface PreToolUseOptions {
  executor?: Executor;
  toolName?: string;
}

export async function handlePreToolUse(
  claudeDir: string,
  sessionId: string,
  toolInput: ToolInput,
  options: PreToolUseOptions = {},
): Promise<HookResult> {
  const paths = await resolvePaths(claudeDir);
  const command = toolInput.command as string | undefined;

  if (command && isCommitCommand(command)) {
    return handleCommitValidation(claudeDir, sessionId, command, options, paths.ketchupDir);
  }

  const patterns = loadDenyPatterns(claudeDir);
  const filePath = toolInput.file_path as string;

  if (filePath && isDenied(filePath, patterns)) {
    activityLog(paths.ketchupDir, sessionId, 'pre-tool-use', `blocked: ${filePath}`);
    debugLog(paths.ketchupDir, 'pre-tool-use', `${filePath} blocked by deny-list`);
    return {
      decision: 'block',
      reason: `Path ${filePath} is denied by ketchup deny-list`,
    };
  }

  const reminders = loadReminders(paths.remindersDir, {
    hook: 'PreToolUse',
    toolName: options.toolName,
  });

  const reminderContent = reminders.map((r) => r.content).join('\n\n');

  activityLog(
    paths.ketchupDir,
    sessionId,
    'pre-tool-use',
    `allowed: ${filePath ?? command}, ${reminders.length} reminder(s)`,
  );

  debugLog(paths.ketchupDir, 'pre-tool-use', `${filePath ?? command} allowed, ${reminders.length} reminder(s)`);

  if (reminderContent) {
    return { decision: 'allow', result: reminderContent };
  }

  return { decision: 'allow' };
}

async function handleCommitValidation(
  claudeDir: string,
  sessionId: string,
  command: string,
  options: PreToolUseOptions,
  ketchupDir: string,
): Promise<HookResult> {
  const paths = await resolvePaths(claudeDir);
  const validators = loadValidators([paths.validatorsDir]);

  if (validators.length === 0) {
    activityLog(ketchupDir, sessionId, 'pre-tool-use', 'commit allowed (no validators)');
    return { decision: 'allow' };
  }

  const context = getCommitContext(process.cwd(), command);
  const results = await validateCommit(validators, context, options.executor);

  const nacks = results.filter((r) => r.decision === 'NACK');

  if (nacks.length > 0) {
    const reasons = nacks.map((n) => `${n.validator}: ${n.reason}`).join('\n');
    activityLog(ketchupDir, sessionId, 'pre-tool-use', `commit blocked: ${reasons}`);
    debugLog(ketchupDir, 'pre-tool-use', `commit blocked: ${reasons}`);
    return {
      decision: 'block',
      reason: reasons,
    };
  }

  activityLog(ketchupDir, sessionId, 'pre-tool-use', 'commit allowed');
  debugLog(ketchupDir, 'pre-tool-use', 'commit allowed');
  return { decision: 'allow' };
}
