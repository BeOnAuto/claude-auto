#!/usr/bin/env tsx

// Deny-list hook: blocks LLM from modifying protected files.
// Reads patterns from deny-list.txt (one pattern per line).
// Lines starting with # are comments. Empty lines are ignored.
// Patterns are treated as regex if they contain regex special chars,
// otherwise as simple substring matches.
// Append /i to a pattern for case-insensitive matching (e.g., CLAUDE\.md$/i)

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log, logError, deny, setSessionId, colors } from './lib/logger.js';
import { readState } from './lib/state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DENY_LIST_FILE = join(__dirname, 'deny-list.txt');

function loadDenyPatterns(): string[] {
  if (!existsSync(DENY_LIST_FILE)) {
    return [];
  }
  return readFileSync(DENY_LIST_FILE, 'utf8')
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line && !line.startsWith('#'));
}

function matchesPattern(filePath: string, pattern: string): boolean {
  let flags = '';
  if (pattern.endsWith('/i')) {
    flags = 'i';
    pattern = pattern.slice(0, -2);
  }

  if (/[\\^$.*+?()[\]{}|]/.test(pattern)) {
    try {
      return new RegExp(pattern, flags).test(filePath);
    } catch {
      return flags === 'i'
        ? filePath.toLowerCase().includes(pattern.toLowerCase())
        : filePath.includes(pattern);
    }
  }
  return flags === 'i'
    ? filePath.toLowerCase().includes(pattern.toLowerCase())
    : filePath.includes(pattern);
}

interface HookInput {
  tool_input?: {
    file_path?: string;
    notebook_path?: string;
  };
  session_id?: string;
}

try {
  const stdin = readFileSync(0, 'utf8').trim();
  if (!stdin) {
    process.exit(0);
  }
  const data: HookInput = JSON.parse(stdin);
  setSessionId(data.session_id);

  // Check state-based enabled flag
  const state = readState();
  if (!state.denyList.enabled) {
    process.exit(0);
  }

  const filePath = data.tool_input?.file_path || data.tool_input?.notebook_path;

  if (!filePath) {
    process.exit(0);
  }

  // Load patterns from deny-list.txt + extra patterns from state
  const patterns = loadDenyPatterns();
  const extraPatterns = state.denyList.extraPatterns || [];
  const allPatterns = [...patterns, ...extraPatterns];
  const matchedPattern = allPatterns.find((pattern: string) => matchesPattern(filePath, pattern));

  if (matchedPattern) {
    const coloredFile = `${colors.cyan}${filePath}${colors.reset}`;
    const coloredPattern = `${colors.dim}pattern: ${matchedPattern}${colors.reset}`;
    log('DENIED', `${coloredFile}\n  ${coloredPattern}`);
    deny(`This file is protected and cannot be modified: ${filePath}`);
  }
} catch (error) {
  logError(error, 'deny-list');
  process.exit(0);
}
