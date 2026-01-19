import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getStatus } from './status.js';

describe('cli status', () => {
  let tempDir: string;
  let packageDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-status-'));
    packageDir = path.join(tempDir, 'claude-ketchup');
    fs.mkdirSync(packageDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('lists expected symlinks from scripts, skills, and commands directories', () => {
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'skills'), { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, 'scripts', 'session-start.ts'),
      'export default {}'
    );
    fs.writeFileSync(
      path.join(packageDir, 'skills', 'reminder.md'),
      '# Reminder'
    );

    const result = getStatus(packageDir);

    expect(result).toEqual({
      symlinks: [
        { path: 'scripts/session-start.ts', status: 'ok' },
        { path: 'skills/reminder.md', status: 'ok' },
      ],
    });
  });

  it('returns empty symlinks when no directories exist', () => {
    const result = getStatus(packageDir);

    expect(result).toEqual({ symlinks: [] });
  });
});
