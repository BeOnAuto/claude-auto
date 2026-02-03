import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeHookLog } from './hook-logger.js';

describe('hook-logger', () => {
  let tempDir: string;
  let autoDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-hook-logger-'));
    autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates log file in .claude-auto/logs/hooks/ named after hook', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: { session_id: 'abc123' },
      output: { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: 'hello' } },
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    expect(fs.existsSync(logsDir)).toBe(true);

    const files = fs.readdirSync(logsDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('session-start.log');
  });

  it('log file contains input section with raw input', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: { session_id: 'test-session', hook_event_name: 'SessionStart' },
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Input ---');
    expect(content).toContain('"session_id": "test-session"');
    expect(content).toContain('"hook_event_name": "SessionStart"');
  });

  it('log file contains resolved paths when provided', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      resolvedPaths: {
        projectRoot: '/tmp/my-project',
        remindersDir: '/tmp/my-project/.claude-auto/reminders',
      },
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Resolved Paths ---');
    expect(content).toContain('projectRoot: /tmp/my-project');
    expect(content).toContain('remindersDir: /tmp/my-project/.claude-auto/reminders');
  });

  it('log file contains reminder files found', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      reminderFiles: ['ketchup.md', 'reminder-ownership.md', 'reminder-docs.md'],
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Reminder Files Found (3) ---');
    expect(content).toContain('ketchup.md');
    expect(content).toContain('reminder-ownership.md');
    expect(content).toContain('reminder-docs.md');
  });

  it('log file contains matched reminders with names and priorities', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      matchedReminders: [
        { name: 'ketchup', priority: 100 },
        { name: 'reminder-ownership', priority: 50 },
      ],
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Matched Reminders (2) ---');
    expect(content).toContain('ketchup (priority: 100)');
    expect(content).toContain('reminder-ownership (priority: 50)');
  });

  it('log file contains output section with JSON output', () => {
    const output = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: 'test' } };
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      output,
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Output ---');
    expect(content).toContain('"hookEventName": "SessionStart"');
  });

  it('log file contains error section when error is provided', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      output: null,
      error: 'ENOENT: no such file or directory',
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('--- Error ---');
    expect(content).toContain('ENOENT: no such file or directory');
  });

  it('log file contains duration when provided', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      output: {},
      durationMs: 42,
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const logFile = fs.readdirSync(logsDir)[0];
    const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');

    expect(content).toContain('Duration: 42ms');
  });

  it('sanitizes hook name for filename', () => {
    writeHookLog(autoDir, {
      hookName: 'PreToolUse',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: {},
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const files = fs.readdirSync(logsDir);
    expect(files[0]).toBe('pretooluse.log');
  });

  it('appends to existing log file instead of creating new ones', () => {
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:00:00.000Z',
      input: { session_id: 'first' },
      output: {},
    });
    writeHookLog(autoDir, {
      hookName: 'session-start',
      timestamp: '2026-01-28T12:01:00.000Z',
      input: { session_id: 'second' },
      output: {},
    });

    const logsDir = path.join(autoDir, 'logs', 'hooks');
    const files = fs.readdirSync(logsDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('session-start.log');

    const content = fs.readFileSync(path.join(logsDir, 'session-start.log'), 'utf8');
    expect(content).toContain('"session_id": "first"');
    expect(content).toContain('"session_id": "second"');
  });
});
