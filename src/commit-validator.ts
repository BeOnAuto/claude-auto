import { execSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';

import type { Validator } from './validator-loader.js';

export function isCommitCommand(command: string): boolean {
  return /\bgit\s+commit\b/.test(command);
}

export interface CommitContext {
  diff: string;
  files: string[];
  message: string;
}

export function getCommitContext(cwd: string, command: string): CommitContext {
  const diff = execSync('git diff --cached', { cwd, encoding: 'utf8' });
  const filesOutput = execSync('git diff --cached --name-only', {
    cwd,
    encoding: 'utf8',
  });
  const files = filesOutput.trim().split('\n').filter(Boolean);
  const message = extractCommitMessage(command);

  return { diff, files, message };
}

function extractCommitMessage(command: string): string {
  const match = command.match(/-m\s+["']([^"']+)["']/);
  return match ? match[1] : '';
}

export function extractAppeal(message: string): string | null {
  const match = message.match(/\[appeal:\s*([^\]]+)\]/);
  return match ? match[1].trim() : null;
}

const VALID_APPEALS = ['coherence', 'existing-gap', 'debug-branchless'];

export function isValidAppeal(appeal: string): boolean {
  return VALID_APPEALS.includes(appeal);
}

export type Executor = (
  cmd: string,
  args: string[],
  options: { encoding: 'utf8' }
) => SpawnSyncReturns<string>;

export interface ValidatorResult {
  decision: 'ACK' | 'NACK';
  reason?: string;
}

export function runValidator(
  validator: Validator,
  context: CommitContext,
  executor: Executor = spawnSync
): ValidatorResult {
  const prompt = buildPrompt(validator, context);
  const result = executor('claude', ['-p', prompt, '--output-format', 'json'], {
    encoding: 'utf8',
  });

  return JSON.parse(result.stdout);
}

function buildPrompt(validator: Validator, context: CommitContext): string {
  return `<diff>
${context.diff}
</diff>

<commit-message>
${context.message}
</commit-message>

<files>
${context.files.join('\n')}
</files>

${validator.content}`;
}

const NON_APPEALABLE_VALIDATORS = ['no-dangerous-git'];

export interface CommitValidationResult {
  validator: string;
  decision: 'ACK' | 'NACK';
  reason?: string;
  appealable: boolean;
}

export function validateCommit(
  validators: Validator[],
  context: CommitContext,
  executor: Executor = spawnSync
): CommitValidationResult[] {
  return validators.map((validator) => {
    const result = runValidator(validator, context, executor);
    return {
      validator: validator.name,
      decision: result.decision,
      reason: result.reason,
      appealable: !NON_APPEALABLE_VALIDATORS.includes(validator.name),
    };
  });
}

export interface HandleCommitValidationResult {
  allowed: boolean;
  results: CommitValidationResult[];
  blockedBy?: string[];
  appeal?: string;
}

export function handleCommitValidation(
  validators: Validator[],
  context: CommitContext,
  executor: Executor = spawnSync
): HandleCommitValidationResult {
  const results = validateCommit(validators, context, executor);
  const appeal = extractAppeal(context.message);
  const validAppeal = appeal && isValidAppeal(appeal);

  const nacks = results.filter((r) => r.decision === 'NACK');
  const nonAppealableNacks = nacks.filter((r) => !r.appealable);
  const appealableNacks = nacks.filter((r) => r.appealable);

  if (nonAppealableNacks.length > 0) {
    return {
      allowed: false,
      results,
      blockedBy: nonAppealableNacks.map((r) => r.validator),
    };
  }

  if (appealableNacks.length > 0 && !validAppeal) {
    return {
      allowed: false,
      results,
      blockedBy: appealableNacks.map((r) => r.validator),
    };
  }

  if (validAppeal && appeal) {
    return { allowed: true, results, appeal };
  }

  return { allowed: true, results };
}

export function formatBlockMessage(results: CommitValidationResult[]): string {
  const nacks = results.filter((r) => r.decision === 'NACK');
  const lines: string[] = [];

  for (const nack of nacks) {
    lines.push(`${nack.validator}: ${nack.reason}`);
  }

  const hasNonAppealable = nacks.some((r) => !r.appealable);
  const hasAppealable = nacks.some((r) => r.appealable);

  if (hasNonAppealable) {
    lines.push('');
    lines.push('This violation cannot be appealed.');
  }

  if (hasAppealable) {
    lines.push('');
    lines.push('To appeal, add [appeal: justification] to your commit message.');
    lines.push(`Valid appeals: ${VALID_APPEALS.join(', ')}`);
  }

  return lines.join('\n');
}
