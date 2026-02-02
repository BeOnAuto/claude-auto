import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

  it('writes to .ketchup/logs/ketchup/debug.log when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir, { recursive: true });

    debugLog(ketchupDir, 'test-hook', 'test message');

    const logPath = path.join(ketchupDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('test-hook');
    expect(content).toContain('test message');
  });

  it('does not write when DEBUG is not set', () => {
    delete process.env.DEBUG;
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir, { recursive: true });

    debugLog(ketchupDir, 'test-hook', 'test message');

    const logPath = path.join(ketchupDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it('includes ISO timestamp in log entries', () => {
    process.env.DEBUG = 'ketchup';
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir, { recursive: true });

    debugLog(ketchupDir, 'test-hook', 'test message');

    const logPath = path.join(ketchupDir, 'logs', 'ketchup', 'debug.log');
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('does not write when DEBUG is set to something else', () => {
    process.env.DEBUG = 'other';
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(ketchupDir, { recursive: true });

    debugLog(ketchupDir, 'test-hook', 'test message');

    const logPath = path.join(ketchupDir, 'logs', 'ketchup', 'debug.log');
    expect(fs.existsSync(logPath)).toBe(false);
  });
});
