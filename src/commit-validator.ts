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

export interface CommitValidationResult {
  validator: string;
  decision: 'ACK' | 'NACK';
  reason?: string;
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
    };
  });
}
