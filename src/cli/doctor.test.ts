import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from '../config-loader.js';
import { doctor } from './doctor.js';

describe('cli doctor', () => {
  let tempDir: string;
  let packageDir: string;
  let claudeDir: string;
  let ketchupDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-doctor-'));
    packageDir = path.join(tempDir, 'node_modules', 'claude-ketchup');
    claudeDir = path.join(tempDir, '.claude');
    ketchupDir = path.join(tempDir, DEFAULT_KETCHUP_DIR);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(ketchupDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports healthy when all symlinks are valid', async () => {
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    const sourceFile = path.join(packageDir, 'scripts', 'session-start.ts');
    fs.writeFileSync(sourceFile, 'export default {}');
    fs.mkdirSync(path.join(claudeDir, 'scripts'), { recursive: true });
    fs.symlinkSync(sourceFile, path.join(claudeDir, 'scripts', 'session-start.ts'));

    const result = await doctor(packageDir, claudeDir);

    expect(result).toEqual({
      healthy: true,
      issues: [],
    });
  });

  it('reports unhealthy when symlinks are missing', async () => {
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'scripts', 'session-start.ts'), '');

    const result = await doctor(packageDir, claudeDir);

    expect(result.healthy).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('reports unhealthy when ketchup symlinks are missing', async () => {
    fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'validators', 'test.md'), '');

    const result = await doctor(packageDir, claudeDir);

    expect(result.healthy).toBe(false);
    expect(result.issues.some(i => i.includes('ketchup'))).toBe(true);
  });
});
