import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanLogs } from './clean-logs.js';

describe('clean-logs', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-cleanlogs-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('deletes log files older than maxAgeMinutes', () => {
    const oldFile = path.join(tempDir, 'old.log');
    const newFile = path.join(tempDir, 'new.log');
    fs.writeFileSync(oldFile, 'old content');
    fs.writeFileSync(newFile, 'new content');

    const oldTime = Date.now() - 120 * 60 * 1000;
    fs.utimesSync(oldFile, new Date(oldTime), new Date(oldTime));

    const result = cleanLogs(tempDir, 60);

    expect(result.deleted).toEqual(['old.log']);
    expect(result.kept).toBe(1);
    expect(fs.existsSync(oldFile)).toBe(false);
    expect(fs.existsSync(newFile)).toBe(true);
  });

  it('keeps files newer than maxAgeMinutes', () => {
    const newFile = path.join(tempDir, 'recent.log');
    fs.writeFileSync(newFile, 'content');

    const result = cleanLogs(tempDir, 60);

    expect(result.deleted).toEqual([]);
    expect(result.kept).toBe(1);
    expect(fs.existsSync(newFile)).toBe(true);
  });

  it('returns empty results when directory does not exist', () => {
    const result = cleanLogs('/nonexistent/path', 60);

    expect(result.deleted).toEqual([]);
    expect(result.kept).toBe(0);
  });

  it('skips subdirectories', () => {
    const subDir = path.join(tempDir, 'subdir');
    fs.mkdirSync(subDir);

    const result = cleanLogs(tempDir, 60);

    expect(result.deleted).toEqual([]);
    expect(result.kept).toBe(0);
    expect(fs.existsSync(subDir)).toBe(true);
  });

  it('uses default age of 60 minutes', () => {
    const oldFile = path.join(tempDir, 'old.log');
    fs.writeFileSync(oldFile, 'content');
    const oldTime = Date.now() - 61 * 60 * 1000;
    fs.utimesSync(oldFile, new Date(oldTime), new Date(oldTime));

    const result = cleanLogs(tempDir);

    expect(result.deleted).toEqual(['old.log']);
  });

  it('skips files that cannot be stat-ed (broken symlinks)', () => {
    const brokenSymlink = path.join(tempDir, 'broken.log');
    fs.symlinkSync('/nonexistent/target', brokenSymlink);
    const goodFile = path.join(tempDir, 'good.log');
    fs.writeFileSync(goodFile, 'content');

    const result = cleanLogs(tempDir);

    expect(result.kept).toBe(1);
  });
});
