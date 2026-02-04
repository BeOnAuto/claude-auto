import { describe, expect, it } from 'vitest';

import { colorizeLogLine } from './log-color.js';

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, '');
}

describe('colorizeLogLine', () => {
  it('preserves plain text content when colorized', () => {
    const line = '02-03 18:12:39 [e7934e89] session-start: loaded 9 reminders';
    const result = colorizeLogLine(line);
    const plain = stripAnsi(result);

    expect(plain).toBe(line);
  });

  it('adds ANSI color codes to structured log lines', () => {
    const line = '02-03 18:12:39 [e7934e89] session-start: loaded 9 reminders';
    const result = colorizeLogLine(line);

    expect(result.includes(ESC)).toBe(true);
  });

  it('dims the timestamp portion', () => {
    const line = '02-03 18:12:39 [e7934e89] session-start: loaded 9 reminders';
    const result = colorizeLogLine(line);

    expect(result.startsWith('\x1b[2m02-03 18:12:39')).toBe(true);
  });

  it('dims the session ID', () => {
    const line = '02-03 18:12:39 [e7934e89] session-start: loaded 9 reminders';
    const result = colorizeLogLine(line);

    expect(result.includes('\x1b[2m[e7934e89]')).toBe(true);
  });

  it('highlights hook name in cyan', () => {
    const line = '02-03 18:12:39 [e7934e89] session-start: loaded 9 reminders';
    const result = colorizeLogLine(line);

    expect(result.includes('\x1b[36msession-start:')).toBe(true);
  });

  it('highlights ACK in green bold', () => {
    const line = '02-03 18:34:57 [db3b58fe] pre-tool-use: validator complete: hygiene → ACK (in:34244 out:86)';
    const result = colorizeLogLine(line);

    expect(result.includes('\x1b[1m\x1b[32mACK\x1b[0m')).toBe(true);
  });

  it('highlights NACK in red bold', () => {
    const line = '02-03 18:34:57 [db3b58fe] pre-tool-use: validator complete: hygiene → NACK';
    const result = colorizeLogLine(line);

    expect(result.includes('\x1b[1m\x1b[31mNACK\x1b[0m')).toBe(true);
  });

  it('returns unstructured lines with dim styling', () => {
    const line = 'some random text without log format';
    const result = colorizeLogLine(line);

    expect(result).toBe(`\x1b[2m${line}\x1b[0m`);
  });

  it('highlights validator names in the message', () => {
    const line =
      '02-03 18:34:51 [db3b58fe] pre-tool-use: validator spawn: batch-0 → validators: backwards-compat, burst-atomicity';
    const result = colorizeLogLine(line);
    const plain = stripAnsi(result);

    expect(plain).toBe(line);
  });
});
