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
import type { ResolvedPaths } from '../path-resolver.js';
import { loadReminders } from '../reminder-loader.js';
import { loadValidators } from '../validator-loader.js';

type ToolInput = Record<string, unknown>;

type HookResult = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse';
    permissionDecision: 'deny' | 'allow';
    permissionDecisionReason?: string;
    additionalContext?: string;
  };
};

interface PreToolUseOptions {
  executor?: Executor;
  toolName?: string;
  cwd?: string;
}

export async function handlePreToolUse(
  paths: ResolvedPaths,
  sessionId: string,
  toolInput: ToolInput,
  options: PreToolUseOptions = {},
): Promise<HookResult> {
  const command = toolInput.command as string | undefined;

  if (command && isCommitCommand(command)) {
    const gitCwd = options.cwd ?? process.cwd();
    return handleCommitValidation(paths, sessionId, command, options, gitCwd);
  }

  const patterns = loadDenyPatterns(paths.claudeDir);
  const filePath = toolInput.file_path as string;

  if (filePath && isDenied(filePath, patterns)) {
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', `blocked: ${filePath}`);
    debugLog(paths.autoDir, 'pre-tool-use', `${filePath} blocked by deny-list`);
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Path ${filePath} is denied by claude-auto deny-list`,
      },
    };
  }

  const state = createHookState(paths.autoDir).read();
  const reminders = loadReminders(
    paths.remindersDirs,
    {
      hook: 'PreToolUse',
      toolName: options.toolName,
    },
    state.overrides.reminders,
  );

  const reminderContent = reminders.map((r) => r.content).join('\n\n');

  if (reminderContent) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: reminderContent,
      },
    };
  }

  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
}

async function handleCommitValidation(
  paths: ResolvedPaths,
  sessionId: string,
  command: string,
  options: PreToolUseOptions,
  gitCwd: string,
): Promise<HookResult> {
  const state = createHookState(paths.autoDir).read();

  if (state.validateCommit.mode === 'off') {
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', 'commit allowed (validation off)');
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    };
  }

  const allValidators = loadValidators(paths.validatorsDirs, state.overrides.validators);
  const validators = allValidators.filter((v) => v.name !== 'appeal-system');

  if (validators.length === 0) {
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', 'commit allowed (no validators)');
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    };
  }

  const context = getCommitContext(gitCwd, command);
  const onLog: ValidatorLogger = (event, name, detail) => {
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', `validator ${event}: ${name} → ${detail}`);
  };
  const results = await validateCommit(validators, context, options.executor, onLog, state.validateCommit.batchCount);

  const nacks = results.filter((r) => r.decision === 'NACK');

  if (nacks.length > 0) {
    const reasons = nacks.map((n) => `${n.validator}: ${n.reason}`).join('\n');
    activityLog(paths.autoDir, sessionId, 'pre-tool-use', `commit blocked: ${reasons}`);
    debugLog(paths.autoDir, 'pre-tool-use', `commit blocked: ${reasons}`);
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reasons,
      },
    };
  }

  activityLog(paths.autoDir, sessionId, 'pre-tool-use', 'commit allowed');
  debugLog(paths.autoDir, 'pre-tool-use', 'commit allowed');
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
}
