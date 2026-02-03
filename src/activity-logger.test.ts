import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activityLog } from './activity-logger.js';

describe('activity-logger', () => {
  let tempDir: string;
  const originalEnv = process.env.KETCHUP_LOG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-activity-'));
    delete process.env.KETCHUP_LOG;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
    if (originalEnv === undefined) {
      delete process.env.KETCHUP_LOG;
    } else {
      process.env.KETCHUP_LOG = originalEnv;
    }
  });

  it('writes to .claude-auto/logs/activity.log', () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-123', 'test-hook', 'test message');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('test-hook');
    expect(content).toContain('test message');
  });

  it('formats log with short date+time and last 8 chars of session ID', () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'abc12345-6789-defg', 'session-start', 'loaded reminders');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    expect(content).toContain('[789-defg]');
    expect(content).toContain('session-start:');
    expect(content).toContain('loaded reminders');
  });

  it('appends multiple log entries', () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'hook-a', 'message 1');
    activityLog(autoDir, 'session-2', 'hook-b', 'message 2');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('message 1');
    expect(lines[1]).toContain('message 2');
  });

  it('filters by KETCHUP_LOG env when set to specific hook', () => {
    process.env.KETCHUP_LOG = 'session-start';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'session-start', 'started');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'allowed: file.ts');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('session-start');
    expect(content).not.toContain('pre-tool-use');
  });

  it('allows multiple comma-separated patterns in KETCHUP_LOG', () => {
    process.env.KETCHUP_LOG = 'session-start,block';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'session-start', 'started');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'block: denied');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'allowed: file.ts');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('session-start');
    expect(content).toContain('block: denied');
    expect(content).not.toContain('allowed: file.ts');
  });

  it('logs everything when KETCHUP_LOG is * or unset', () => {
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'session-start', 'started');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'allowed: file.ts');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('session-start');
    expect(content).toContain('pre-tool-use');
  });

  it('excludes patterns prefixed with -', () => {
    process.env.KETCHUP_LOG = '*,-allowed';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'session-start', 'started');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'blocked: secret.ts');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'allowed: file.ts');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('session-start');
    expect(content).toContain('blocked: secret.ts');
    expect(content).not.toContain('allowed: file.ts');
  });

  it('combines includes and excludes', () => {
    process.env.KETCHUP_LOG = 'pre-tool-use,-allowed';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    activityLog(autoDir, 'session-1', 'session-start', 'started');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'blocked: secret.ts');
    activityLog(autoDir, 'session-1', 'pre-tool-use', 'allowed: file.ts');

    const logPath = path.join(autoDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).not.toContain('session-start');
    expect(content).toContain('blocked: secret.ts');
    expect(content).not.toContain('allowed: file.ts');
  });
});
