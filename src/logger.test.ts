import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  colors,
  createLogger,
  type LogLevel,
} from './logger.js';

describe('logger', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-logger-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('createLogger', () => {
    it('creates log file with session prefix when session id provided', () => {
      const logger = createLogger(tempDir, 'abc12345-full-session-id');
      logger.log('INFO', 'test message');

      const files = fs.readdirSync(tempDir);
      const logFile = files.find((f) => f.startsWith('abc12345-') && f.endsWith('.log'));
      expect(logFile).toBeDefined();
    });

    it('creates unknown.log when no session id provided', () => {
      const logger = createLogger(tempDir);
      logger.log('INFO', 'test message');

      expect(fs.existsSync(path.join(tempDir, 'unknown.log'))).toBe(true);
    });

    it('reuses existing log file for same session prefix', () => {
      const existingLog = path.join(tempDir, 'abc12345-2026-01-01T00-00-00.log');
      fs.writeFileSync(existingLog, 'existing content\n');

      const logger = createLogger(tempDir, 'abc12345-full-session-id');
      logger.log('INFO', 'new message');

      const content = fs.readFileSync(existingLog, 'utf8');
      expect(content).toContain('existing content');
      expect(content).toContain('new message');
    });

    it('creates logs directory if it does not exist', () => {
      const nestedDir = path.join(tempDir, 'nested', 'logs');
      const logger = createLogger(nestedDir, 'session123');
      logger.log('INFO', 'test');

      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });

  describe('log', () => {
    it('writes timestamped message with log level', () => {
      const logger = createLogger(tempDir, 'test-session');
      logger.log('INFO', 'hello world');

      const files = fs.readdirSync(tempDir);
      const logFile = files.find((f) => f.endsWith('.log'));
      const content = fs.readFileSync(path.join(tempDir, logFile!), 'utf8');

      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(content).toContain('INFO');
      expect(content).toContain('hello world');
    });

    it('applies color codes to log level', () => {
      const logger = createLogger(tempDir, 'test-session');
      logger.log('ACK', 'success');

      const files = fs.readdirSync(tempDir);
      const logFile = files.find((f) => f.endsWith('.log'));
      const content = fs.readFileSync(path.join(tempDir, logFile!), 'utf8');

      expect(content).toContain(colors.bold);
      expect(content).toContain(colors.green);
    });

    it('supports all log levels', () => {
      const logger = createLogger(tempDir, 'test-session');
      const levels: LogLevel[] = ['ACK', 'NACK', 'ERROR', 'WARN', 'SKIP', 'INFO', 'DENIED', 'CONTINUE'];

      for (const level of levels) {
        logger.log(level, `test ${level}`);
      }

      const files = fs.readdirSync(tempDir);
      const logFile = files.find((f) => f.endsWith('.log'));
      const content = fs.readFileSync(path.join(tempDir, logFile!), 'utf8');

      for (const level of levels) {
        expect(content).toContain(level);
      }
    });
  });

  describe('logError', () => {
    it('writes error to err.log with timestamp and context', () => {
      const logger = createLogger(tempDir, 'test-session');
      const error = new Error('test error');
      logger.logError(error, 'validate-commit');

      const errLog = path.join(tempDir, 'err.log');
      expect(fs.existsSync(errLog)).toBe(true);

      const content = fs.readFileSync(errLog, 'utf8');
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
      expect(content).toContain('[validate-commit]');
      expect(content).toContain('test error');
    });

    it('writes error without context when not provided', () => {
      const logger = createLogger(tempDir, 'test-session');
      logger.logError(new Error('bare error'));

      const errLog = path.join(tempDir, 'err.log');
      const content = fs.readFileSync(errLog, 'utf8');
      expect(content).toContain('bare error');
      expect(content).not.toContain('[]');
    });

    it('handles non-Error objects', () => {
      const logger = createLogger(tempDir, 'test-session');
      logger.logError('string error');

      const errLog = path.join(tempDir, 'err.log');
      const content = fs.readFileSync(errLog, 'utf8');
      expect(content).toContain('string error');
    });
  });

  describe('colors', () => {
    it('exports ANSI color codes', () => {
      expect(colors.reset).toBe('\x1b[0m');
      expect(colors.dim).toBe('\x1b[2m');
      expect(colors.bold).toBe('\x1b[1m');
      expect(colors.red).toBe('\x1b[31m');
      expect(colors.green).toBe('\x1b[32m');
      expect(colors.yellow).toBe('\x1b[33m');
      expect(colors.cyan).toBe('\x1b[36m');
      expect(colors.magenta).toBe('\x1b[35m');
    });
  });
});
