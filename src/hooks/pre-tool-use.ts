import * as path from 'node:path';

import {
  getCommitContext,
  isCommitCommand,
  validateCommit,
  type Executor,
} from '../commit-validator.js';
import { debugLog } from '../debug-logger.js';
import { isDenied, loadDenyPatterns } from '../deny-list.js';
import { loadValidators } from '../validator-loader.js';

type ToolInput = Record<string, unknown>;

type HookResult = {
  decision: 'block' | 'allow';
  reason?: string;
};

interface PreToolUseOptions {
  executor?: Executor;
}

export function handlePreToolUse(
  claudeDir: string,
  toolInput: ToolInput,
  options: PreToolUseOptions = {}
): HookResult {
  const command = toolInput.command as string | undefined;

  if (command && isCommitCommand(command)) {
    return handleCommitValidation(claudeDir, command, options);
  }

  const patterns = loadDenyPatterns(claudeDir);
  const filePath = toolInput.file_path as string;

  if (filePath && isDenied(filePath, patterns)) {
    debugLog(claudeDir, 'pre-tool-use', `${filePath} blocked by deny-list`);
    return {
      decision: 'block',
      reason: `Path ${filePath} is denied by ketchup deny-list`,
    };
  }

  debugLog(claudeDir, 'pre-tool-use', `${filePath ?? command} allowed`);
  return { decision: 'allow' };
}

function handleCommitValidation(
  claudeDir: string,
  command: string,
  options: PreToolUseOptions
): HookResult {
  const validatorsDir = path.join(claudeDir, 'validators');
  const validators = loadValidators([validatorsDir]);

  if (validators.length === 0) {
    return { decision: 'allow' };
  }

  const context = getCommitContext(process.cwd(), command);
  const results = validateCommit(validators, context, options.executor);

  const nacks = results.filter((r) => r.decision === 'NACK');

  if (nacks.length > 0) {
    const reasons = nacks
      .map((n) => `${n.validator}: ${n.reason}`)
      .join('\n');
    debugLog(claudeDir, 'pre-tool-use', `commit blocked: ${reasons}`);
    return {
      decision: 'block',
      reason: reasons,
    };
  }

  debugLog(claudeDir, 'pre-tool-use', 'commit allowed');
  return { decision: 'allow' };
}
