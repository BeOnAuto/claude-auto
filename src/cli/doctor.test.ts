import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_AUTO_DIR } from '../config-loader.js';
import { doctor } from './doctor.js';

describe('cli doctor', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;
  let autoDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-doctor-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-auto');
    claudeDir = path.join(tempDir, '.claude');
    autoDir = path.join(tempDir, DEFAULT_AUTO_DIR);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(autoDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports healthy when all symlinks are valid', async () => {
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    const sourceFile = path.join(packageDir, 'commands', 'cmd.md');
    fs.writeFileSync(sourceFile, '# Command');
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
    fs.symlinkSync(sourceFile, path.join(claudeDir, 'commands', 'cmd.md'));

    const result = await doctor(packageDir, claudeDir);

    expect(result).toEqual({
      healthy: true,
      issues: [],
    });
  });

  it('reports unhealthy when symlinks are missing', async () => {
    fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'commands', 'cmd.md'), '');

    const result = await doctor(packageDir, claudeDir);

    expect(result.healthy).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('reports unhealthy when auto symlinks are missing', async () => {
    fs.mkdirSync(path.join(packageDir, '.claude-auto', 'validators'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, '.claude-auto', 'validators', 'test.md'), '');

    const result = await doctor(packageDir, claudeDir);

    expect(result.healthy).toBe(false);
    expect(result.issues.some((i) => i.includes('claude-auto'))).toBe(true);
  });
});
