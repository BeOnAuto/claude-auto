import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { install } from './cli/install.js';

describe('e2e', () => {
  describe('full installation flow', () => {
    let tempDir: string;
    let projectDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-e2e-'));
      projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('installs all files into target directory', async () => {
      const result = await install(projectDir);

      expect(result.targetDir).toBe(projectDir);
      expect(result.claudeDir).toBe(path.join(projectDir, '.claude'));
      expect(result.settingsCreated).toBe(true);

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.ketchup'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.claude', 'settings.json'))).toBe(true);

      // Scripts are regular files in .ketchup/scripts, not symlinks
      const scriptPath = path.join(projectDir, '.ketchup', 'scripts', 'session-start.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.lstatSync(scriptPath).isSymbolicLink()).toBe(false);

      // Reminders are regular files, not symlinks
      const reminderFiles = fs.readdirSync(path.join(projectDir, '.ketchup', 'reminders'));
      expect(reminderFiles.length).toBeGreaterThan(0);
      for (const file of reminderFiles) {
        expect(fs.lstatSync(path.join(projectDir, '.ketchup', 'reminders', file)).isSymbolicLink()).toBe(false);
      }
    });

    it('is idempotent — second install preserves existing settings', async () => {
      await install(projectDir);

      const settingsPath = path.join(projectDir, '.claude', 'settings.json');
      const settingsBefore = fs.readFileSync(settingsPath, 'utf-8');

      const result = await install(projectDir);

      expect(result.settingsCreated).toBe(false);
      expect(fs.readFileSync(settingsPath, 'utf-8')).toBe(settingsBefore);
    });
  });
});
