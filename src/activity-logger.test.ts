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
});
