import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runPreuninstallSync } from './preuninstall.js';

describe('preuninstall', () => {
  describe('runPreuninstallSync', () => {
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

    it('removes symlinks from .claude directory', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const claudeDir = path.join(projectDir, '.claude');
      const scriptsDir = path.join(claudeDir, 'scripts');
      const sourceFile = path.join(tempDir, 'source.ts');
      const symlinkFile = path.join(scriptsDir, 'session-start.ts');

      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.writeFileSync(sourceFile, 'export default {}');
      fs.symlinkSync(sourceFile, symlinkFile);
      process.env.KETCHUP_ROOT = projectDir;

      runPreuninstallSync();

      expect(fs.existsSync(symlinkFile)).toBe(false);
      expect(fs.existsSync(sourceFile)).toBe(true);
    });

    it('removes symlinks from ketchup directory', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const ketchupDir = path.join(projectDir, 'ketchup');
      const remindersDir = path.join(ketchupDir, 'reminders');
      const sourceFile = path.join(tempDir, 'source.md');
      const symlinkFile = path.join(remindersDir, 'reminder.md');

      fs.mkdirSync(remindersDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.writeFileSync(sourceFile, '# Reminder');
      fs.symlinkSync(sourceFile, symlinkFile);
      process.env.KETCHUP_ROOT = projectDir;

      runPreuninstallSync();

      expect(fs.existsSync(symlinkFile)).toBe(false);
      expect(fs.existsSync(sourceFile)).toBe(true);
    });

    it('does nothing when .claude subdirectories do not exist', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const claudeDir = path.join(projectDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      runPreuninstallSync();

      expect(fs.existsSync(claudeDir)).toBe(true);
    });

    it('preserves regular files and only removes symlinks', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const claudeDir = path.join(projectDir, '.claude');
      const scriptsDir = path.join(claudeDir, 'scripts');
      const regularFile = path.join(scriptsDir, 'local-script.ts');
      const sourceFile = path.join(tempDir, 'source.ts');
      const symlinkFile = path.join(scriptsDir, 'session-start.ts');

      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.writeFileSync(regularFile, 'local content');
      fs.writeFileSync(sourceFile, 'export default {}');
      fs.symlinkSync(sourceFile, symlinkFile);
      process.env.KETCHUP_ROOT = projectDir;

      runPreuninstallSync();

      expect(fs.existsSync(symlinkFile)).toBe(false);
      expect(fs.existsSync(regularFile)).toBe(true);
      expect(fs.readFileSync(regularFile, 'utf-8')).toBe('local content');
    });
  });
});
