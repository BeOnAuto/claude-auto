import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getExpectedSymlinks, repair } from './repair.js';

describe('cli repair', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-repair-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-ketchup');
    claudeDir = path.join(tempDir, '.claude');
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('recreates symlinks for specified files', () => {
    const sourceFile = path.join(packageDir, 'scripts', 'session-start.ts');
    fs.writeFileSync(sourceFile, 'export default {}');

    const result = repair(packageDir, claudeDir, ['scripts/session-start.ts']);

    expect(result).toEqual({
      repaired: ['scripts/session-start.ts'],
    });
    expect(fs.readlinkSync(path.join(claudeDir, 'scripts', 'session-start.ts'))).toBe(sourceFile);
  });

  it('getExpectedSymlinks finds files in scripts, skills, and commands directories', () => {
    fs.writeFileSync(path.join(packageDir, 'scripts', 'hook.ts'), '');
    fs.mkdirSync(path.join(packageDir, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'skills', 'skill.md'), '');

    const result = getExpectedSymlinks(packageDir);

    expect(result).toEqual(['scripts/hook.ts', 'skills/skill.md']);
  });
});
