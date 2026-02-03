import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { debugLog } from './debug-logger.js';

describe('debug-logger', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-debug-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('writes to .claude-auto/logs/claude-auto/debug.log when DEBUG=claude-auto', () => {
    process.env.DEBUG = 'claude-auto';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    debugLog(autoDir, 'test-hook', 'test message');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('test-hook');
    expect(content).toContain('test message');
  });

  it('does not write when DEBUG is not set', () => {
    delete process.env.DEBUG;
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    debugLog(autoDir, 'test-hook', 'test message');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it('includes ISO timestamp in log entries', () => {
    process.env.DEBUG = 'claude-auto';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    debugLog(autoDir, 'test-hook', 'test message');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('does not write when DEBUG is set to something else', () => {
    process.env.DEBUG = 'other';
    const autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });

    debugLog(autoDir, 'test-hook', 'test message');

    const logPath = path.join(autoDir, 'logs', 'claude-auto', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });
});
