import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { activityLog } from './activity-logger.js';

describe('activity-logger', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-activity-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('writes to .claude/logs/activity.log', () => {
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    activityLog(claudeDir, 'session-123', 'test-hook', 'test message');

    const logPath = path.join(claudeDir, 'logs', 'activity.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('test-hook');
    expect(content).toContain('test message');
  });

  it('formats log with short date+time and last 8 chars of session ID', () => {
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    activityLog(claudeDir, 'abc12345-6789-defg', 'session-start', 'loaded reminders');

    const logPath = path.join(claudeDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    expect(content).toContain('[789-defg]');
    expect(content).toContain('session-start:');
    expect(content).toContain('loaded reminders');
  });

  it('appends multiple log entries', () => {
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    activityLog(claudeDir, 'session-1', 'hook-a', 'message 1');
    activityLog(claudeDir, 'session-2', 'hook-b', 'message 2');

    const logPath = path.join(claudeDir, 'logs', 'activity.log');
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('message 1');
    expect(lines[1]).toContain('message 2');
  });
});
