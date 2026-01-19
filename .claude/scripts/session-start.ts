#!/usr/bin/env tsx

// SessionStart hook: creates the log file with preamble when a session begins.
// Also ensures .claude.hooks.json exists at project root.

import { readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logError, getLogDir, getProjectDir } from './lib/logger.js';
import { readState } from './lib/state.js';

interface HookInput {
  session_id?: string;
  cwd?: string;
}

try {
  const stdin = readFileSync(0, 'utf8').trim();
  if (!stdin) {
    process.exit(0);
  }
  const data: HookInput = JSON.parse(stdin);
  const sessionId = data.session_id;

  if (!sessionId) {
    process.exit(0);
  }

  const LOG_DIR = getLogDir();

  // Ensure logs directory exists
  mkdirSync(LOG_DIR, { recursive: true });

  // Create log file with preamble
  const prefix = sessionId.slice(0, 8);
  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, '');
  const filename = `${prefix}-${timestamp}.log`;
  const logFilePath = join(LOG_DIR, filename);

  // Derive project slug from project dir
  const projectDir = getProjectDir();
  // Convert /Users/sam/code/auto/1 -> -Users-sam-code-auto-1
  const projectSlug = projectDir.replace(/\//g, '-');
  const jsonlPath = `~/.claude/projects/${projectSlug}/${sessionId}.jsonl`;

  // Write session header with tail command hint
  appendFileSync(logFilePath, `session: ${sessionId}\ntail -f ${jsonlPath}\n\n`);

  // Ensure .claude.hooks.json exists (readState creates it with defaults if missing)
  readState();

} catch (error) {
  logError(error, 'session-start');
  process.exit(0);
}
