#!/usr/bin/env tsx

// State management for Claude Code hooks
// Central configuration via .claude/state.json

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// State file is at project root: xolvo/.claude.hooks.json
// lib/ -> scripts/ -> .claude/ -> xolvo/
const STATE_FILE = join(__dirname, '..', '..', '..', '.claude.hooks.json');

// ============================================
// State Schema
// ============================================

export type ContinueMode = 'smart' | 'non-stop' | 'off';
export type CommitMode = 'strict' | 'warn' | 'off';

export interface AutoContinueState {
  mode: ContinueMode;        // smart=Claude decides, non-stop=always continue, off=never
  maxIterations?: number;     // Optional limit for non-stop mode (0 = unlimited)
  iteration?: number;         // Current iteration count
  skipModes?: string[];       // Permission modes to skip (default: ["plan"])
}

export interface ValidateCommitState {
  mode: CommitMode;          // strict=deny on NACK, warn=log only, off=skip
}

export interface DenyListState {
  enabled: boolean;
  extraPatterns?: string[];   // Additional patterns beyond deny-list.txt
}

export interface PromptReminderState {
  enabled: boolean;
  customReminder?: string;    // Optional custom reminder text
}

export interface HookState {
  autoContinue: AutoContinueState;
  validateCommit: ValidateCommitState;
  denyList: DenyListState;
  promptReminder: PromptReminderState;
  updatedAt: string;          // ISO timestamp of last update
  updatedBy?: string;         // What triggered the update
}

// ============================================
// Default State
// ============================================

export const DEFAULT_STATE: HookState = {
  autoContinue: {
    mode: 'smart',
    maxIterations: 0,
    iteration: 0,
    skipModes: ['plan'],
  },
  validateCommit: {
    mode: 'strict',
  },
  denyList: {
    enabled: true,
    extraPatterns: [],
  },
  promptReminder: {
    enabled: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'default',
};

// ============================================
// State Operations
// ============================================

export function getStatePath(): string {
  return STATE_FILE;
}

export function readState(): HookState {
  try {
    if (!existsSync(STATE_FILE)) {
      // Create default state file on first access
      const state = { ...DEFAULT_STATE, updatedAt: new Date().toISOString(), updatedBy: 'init' };
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
      return state;
    }
    const content = readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(content) as Partial<HookState>;
    // Merge with defaults to ensure all fields exist
    return {
      autoContinue: { ...DEFAULT_STATE.autoContinue, ...state.autoContinue },
      validateCommit: { ...DEFAULT_STATE.validateCommit, ...state.validateCommit },
      denyList: { ...DEFAULT_STATE.denyList, ...state.denyList },
      promptReminder: { ...DEFAULT_STATE.promptReminder, ...state.promptReminder },
      updatedAt: state.updatedAt || DEFAULT_STATE.updatedAt,
      updatedBy: state.updatedBy,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeState(state: HookState): void {
  state.updatedAt = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

export function updateState(updates: Partial<HookState>, updatedBy?: string): HookState {
  const current = readState();
  const newState: HookState = {
    ...current,
    ...updates,
    autoContinue: { ...current.autoContinue, ...updates.autoContinue },
    validateCommit: { ...current.validateCommit, ...updates.validateCommit },
    denyList: { ...current.denyList, ...updates.denyList },
    promptReminder: { ...current.promptReminder, ...updates.promptReminder },
    updatedBy: updatedBy || 'unknown',
  };
  writeState(newState);
  return newState;
}

export function resetState(updatedBy?: string): HookState {
  const state = { ...DEFAULT_STATE, updatedBy: updatedBy || 'reset' };
  writeState(state);
  return state;
}

// ============================================
// Convenience Getters
// ============================================

export function getContinueMode(): ContinueMode {
  return readState().autoContinue.mode;
}

export function getCommitMode(): CommitMode {
  return readState().validateCommit.mode;
}

export function isDenyListEnabled(): boolean {
  return readState().denyList.enabled;
}

export function isPromptReminderEnabled(): boolean {
  return readState().promptReminder.enabled;
}

export function incrementIteration(): number {
  const state = readState();
  state.autoContinue.iteration = (state.autoContinue.iteration || 0) + 1;
  writeState(state);
  return state.autoContinue.iteration;
}

export function resetIteration(): void {
  const state = readState();
  state.autoContinue.iteration = 0;
  writeState(state);
}

// ============================================
// Formatted Output
// ============================================

export function formatState(state: HookState): string {
  const lines = [
    '╭─────────────────────────────────────────╮',
    '│         🎛️  Hook Control State          │',
    '├─────────────────────────────────────────┤',
    `│  Auto-Continue: ${state.autoContinue.mode.padEnd(23)}│`,
  ];

  if (state.autoContinue.mode === 'non-stop') {
    const max = state.autoContinue.maxIterations || 0;
    const iter = state.autoContinue.iteration || 0;
    const maxStr = max > 0 ? `${iter}/${max}` : `${iter}/∞`;
    lines.push(`│    Iterations: ${maxStr.padEnd(24)}│`);
  }

  if (state.autoContinue.skipModes?.length) {
    lines.push(`│    Skip Modes: ${state.autoContinue.skipModes.join(', ').padEnd(24)}│`);
  }

  lines.push(
    `│  Commit Validation: ${state.validateCommit.mode.padEnd(19)}│`,
    `│  Deny List: ${(state.denyList.enabled ? 'enabled' : 'disabled').padEnd(27)}│`,
    `│  Prompt Reminder: ${(state.promptReminder.enabled ? 'enabled' : 'disabled').padEnd(21)}│`,
    '├─────────────────────────────────────────┤',
    `│  Updated: ${state.updatedAt.slice(0, 19).padEnd(29)}│`,
    `│  By: ${(state.updatedBy || 'unknown').slice(0, 34).padEnd(34)}│`,
    '╰─────────────────────────────────────────╯',
  );

  return lines.join('\n');
}

// ============================================
// CLI Mode
// ============================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (!command || command === 'status') {
    const state = readState();
    console.log(formatState(state));
    console.log('\nRaw state:');
    console.log(JSON.stringify(state, null, 2));
  } else if (command === 'reset') {
    const state = resetState('cli');
    console.log('State reset to defaults:');
    console.log(formatState(state));
  } else {
    console.log('Usage: npx tsx state.ts [status|reset]');
  }
}
