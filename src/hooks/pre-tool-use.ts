import { activityLog } from '../activity-logger.js';
import {
  type Executor,
  getCommitContext,
  isCommitCommand,
  type ValidatorLogger,
  validateCommit,
} from '../commit-validator.js';
import { debugLog } from '../debug-logger.js';
import { isDenied, loadDenyPatterns } from '../deny-list.js';
import { createHookState } from '../hook-state.js';
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
    return handleCommitValidation(claudeDir, sessionId, command, options, paths.autoDir);
  }

  const patterns = loadDenyPatterns(claudeDir);
  const filePath = toolInput.file_path as string;

  if (filePath && isDenied(filePath, patterns)) {
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', `blocked: ${filePath}`);
    debugLog(paths.autoDir, 'pre-tool-use', `${filePath} blocked by deny-list`);
    return {
      decision: 'block',
      reason: `Path ${filePath} is denied by claude-auto deny-list`,
    };
  }

  const reminders = loadReminders(paths.remindersDir, {
    hook: 'PreToolUse',
    toolName: options.toolName,
  });

  const reminderContent = reminders.map((r) => r.content).join('\n\n');

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
  autoDir: string,
): Promise<HookResult> {
  const paths = await resolvePaths(claudeDir);
  const allValidators = loadValidators([paths.validatorsDir]);
  const validators = allValidators.filter((v) => v.name !== 'appeal-system');

  if (validators.length === 0) {
    activityLog(autoDir, sessionId, 'pre-tool-use', 'commit allowed (no validators)');
    return { decision: 'allow' };
  }

  const context = getCommitContext(process.cwd(), command);
  const state = createHookState(autoDir).read();
  const onLog: ValidatorLogger = (event, name, detail) => {
    activityLog(autoDir, sessionId, 'pre-tool-use', `validator ${event}: ${name}${detail ? ` → ${detail}` : ''}`);
  };
  const results = await validateCommit(validators, context, options.executor, onLog, state.validateCommit.batchCount);

  const nacks = results.filter((r) => r.decision === 'NACK');

  if (nacks.length > 0) {
    const reasons = nacks.map((n) => `${n.validator}: ${n.reason}`).join('\n');
    activityLog(autoDir, sessionId, 'pre-tool-use', `commit blocked: ${reasons}`);
    debugLog(autoDir, 'pre-tool-use', `commit blocked: ${reasons}`);
    return {
      decision: 'block',
      reason: reasons,
    };
  }

  activityLog(autoDir, sessionId, 'pre-tool-use', 'commit allowed');
  debugLog(autoDir, 'pre-tool-use', 'commit allowed');
  return { decision: 'allow' };
}
