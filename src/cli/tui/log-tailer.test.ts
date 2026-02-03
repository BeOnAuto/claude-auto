import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLogTailer } from './log-tailer.js';

describe('createLogTailer', () => {
  let tempDir: string;
  let logsDir: string;
  let logFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'log-tailer-'));
    logsDir = path.join(tempDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    logFile = path.join(logsDir, 'activity.log');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reads existing log lines on start', () => {
    fs.writeFileSync(logFile, 'line1\nline2\n');
    const tailer = createLogTailer(tempDir);
    const lines = tailer.readAll();
    tailer.stop();

    expect(lines).toEqual(['line1', 'line2']);
  });

  it('returns empty array when log file does not exist', () => {
    const tailer = createLogTailer(tempDir);
    const lines = tailer.readAll();
    tailer.stop();

    expect(lines).toEqual([]);
  });

  it('detects new lines appended after start', async () => {
    fs.writeFileSync(logFile, '');
    const received: string[] = [];
    const tailer = createLogTailer(tempDir, (line) => received.push(line));

    fs.appendFileSync(logFile, 'new-line\n');

    await new Promise((r) => setTimeout(r, 200));
    tailer.stop();

    expect(received).toEqual(['new-line']);
  });

  it('keeps only last N lines via maxLines option', () => {
    fs.writeFileSync(logFile, 'a\nb\nc\nd\ne\n');
    const tailer = createLogTailer(tempDir, undefined, { maxLines: 3 });
    const lines = tailer.readAll();
    tailer.stop();

    expect(lines).toEqual(['c', 'd', 'e']);
  });

  it('stop prevents further callbacks', async () => {
    fs.writeFileSync(logFile, '');
    const received: string[] = [];
    const tailer = createLogTailer(tempDir, (line) => received.push(line));
    tailer.stop();

    fs.appendFileSync(logFile, 'after-stop\n');
    await new Promise((r) => setTimeout(r, 200));

    expect(received).toEqual([]);
  });
});
