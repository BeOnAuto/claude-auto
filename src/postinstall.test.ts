import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runPostinstall } from './postinstall.js';

describe('postinstall', () => {
  describe('runPostinstall', () => {
    let tempDir: string;
    const originalEnv = process.env;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      process.env = originalEnv;
    });

    it('detects project root and returns it', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      const result = runPostinstall();

      expect(result).toEqual({
        projectRoot: projectDir,
        claudeDir: path.join(projectDir, '.claude'),
        symlinkedFiles: [],
      });
    });

    it('creates .claude directory in project root', () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      runPostinstall();

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
      expect(fs.statSync(path.join(projectDir, '.claude')).isDirectory()).toBe(
        true
      );
    });

    it('symlinks files from package scripts/, skills/, commands/ to .claude/', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'skills'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
      fs.writeFileSync(
        path.join(packageDir, 'scripts', 'session-start.ts'),
        'export default {}'
      );
      fs.writeFileSync(
        path.join(packageDir, 'skills', 'my-skill.md'),
        '# Skill'
      );
      fs.writeFileSync(
        path.join(packageDir, 'commands', 'my-command.md'),
        '# Command'
      );
      process.env.KETCHUP_ROOT = projectDir;

      const result = runPostinstall(packageDir);

      expect(result.symlinkedFiles).toEqual([
        'scripts/session-start.ts',
        'skills/my-skill.md',
        'commands/my-command.md',
      ]);
      expect(
        fs.lstatSync(
          path.join(projectDir, '.claude', 'scripts', 'session-start.ts')
        ).isSymbolicLink()
      ).toBe(true);
      expect(
        fs.lstatSync(
          path.join(projectDir, '.claude', 'skills', 'my-skill.md')
        ).isSymbolicLink()
      ).toBe(true);
      expect(
        fs.lstatSync(
          path.join(projectDir, '.claude', 'commands', 'my-command.md')
        ).isSymbolicLink()
      ).toBe(true);
    });
  });
});
