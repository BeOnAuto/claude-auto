import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('npm installation', () => {
  const baseDir = path.join(process.env.HOME || '/tmp', 'temp-ketchup');
  const testDir = path.join(baseDir, 'test-project');
  const packageRoot = path.resolve(__dirname, '..');
  let tarballPath: string;

  beforeEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });

    execSync('pnpm store prune', { stdio: 'pipe' });
    execSync('pnpm build', { cwd: packageRoot, stdio: 'pipe' });
    const packOutput = execSync(`pnpm pack --pack-destination ${baseDir}`, {
      cwd: packageRoot,
      encoding: 'utf-8',
    });
    const lines = packOutput.trim().split('\n');
    tarballPath = lines[lines.length - 1];
  });

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
  });

  it('creates .claude directory when installed via pnpm add', () => {
    execSync('pnpm init', { cwd: testDir, stdio: 'pipe' });
    execSync(`pnpm add -D ${tarballPath} --allow-build=claude-ketchup`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const claudeDir = path.join(testDir, '.claude');
    expect(fs.existsSync(claudeDir)).toBe(true);
  });
});
