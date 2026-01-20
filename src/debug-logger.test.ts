import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { debugLog } from './debug-logger.js';

describe('debug-logger', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-debug-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('writes to .claude/logs/ketchup.log when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    debugLog(claudeDir, 'test-hook', 'test message');

    const logPath = path.join(claudeDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('test-hook');
    expect(content).toContain('test message');
  });

  it('does not write when DEBUG is not set', () => {
    delete process.env.DEBUG;
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    debugLog(claudeDir, 'test-hook', 'test message');

    const logPath = path.join(claudeDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it('does not write when DEBUG is set to something else', () => {
    process.env.DEBUG = 'other';
    const claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    debugLog(claudeDir, 'test-hook', 'test message');

    const logPath = path.join(claudeDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });
});
