import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scanReminders } from './reminder-loader.js';

describe('scanReminders', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-reminder-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when reminders directory does not exist', () => {
    const result = scanReminders(tempDir);

    expect(result).toEqual([]);
  });

  it('returns .md file names from reminders directory', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir);
    fs.writeFileSync(path.join(remindersDir, 'ketchup.md'), '# Test');
    fs.writeFileSync(path.join(remindersDir, 'plan-mode.md'), '# Plan');
    fs.writeFileSync(path.join(remindersDir, 'ignore.txt'), 'not a reminder');

    const result = scanReminders(tempDir);

    expect(result).toEqual(['ketchup.md', 'plan-mode.md']);
  });
});
