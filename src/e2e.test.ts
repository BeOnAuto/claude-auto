import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from './config-loader.js';
import { runPostinstall } from './postinstall.js';
import { runPreuninstallSync } from './preuninstall.js';

describe('e2e', () => {
  describe('full installation flow', () => {
    let tempDir: string;
    let projectDir: string;
    let packageDir: string;
    const originalEnv = process.env;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-e2e-'));
      projectDir = path.join(tempDir, 'my-project');
      packageDir = path.join(tempDir, 'claude-ketchup');

      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

      fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });

      fs.writeFileSync(
        path.join(packageDir, 'dist', 'scripts', 'session-start.js'),
        'export default {}'
      );
      fs.writeFileSync(
        path.join(packageDir, 'reminders', 'my-reminder.md'),
        '---\npriority: 100\n---\n# Reminder'
      );
      fs.writeFileSync(
        path.join(packageDir, 'templates', 'settings.json'),
        JSON.stringify({ hooks: { SessionStart: [] } })
      );

      process.env = { ...originalEnv, KETCHUP_ROOT: projectDir };
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      process.env = originalEnv;
    });

    it('installs and uninstalls cleanly', async () => {
      const result = await runPostinstall(packageDir);

      expect(result.projectRoot).toBe(projectDir);
      expect(result.claudeDir).toBe(path.join(projectDir, '.claude'));
      expect(result.ketchupDir).toBe(path.join(projectDir, DEFAULT_KETCHUP_DIR));
      expect(result.symlinkedFiles).toContain('scripts/session-start.js');
      expect(result.symlinkedFiles).toContain(`${DEFAULT_KETCHUP_DIR}/reminders/my-reminder.md`);

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, DEFAULT_KETCHUP_DIR))).toBe(true);
      expect(
        fs.lstatSync(
          path.join(projectDir, '.claude', 'scripts', 'session-start.js')
        ).isSymbolicLink()
      ).toBe(true);
      expect(
        fs.lstatSync(
          path.join(projectDir, DEFAULT_KETCHUP_DIR, 'reminders', 'my-reminder.md')
        ).isSymbolicLink()
      ).toBe(true);
      expect(
        fs.existsSync(path.join(projectDir, '.claude', 'settings.json'))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(projectDir, '.claude', '.gitignore'))
      ).toBe(true);

      runPreuninstallSync();

      expect(
        fs.existsSync(
          path.join(projectDir, '.claude', 'scripts', 'session-start.js')
        )
      ).toBe(false);
      expect(
        fs.existsSync(
          path.join(projectDir, DEFAULT_KETCHUP_DIR, 'reminders', 'my-reminder.md')
        )
      ).toBe(false);
      expect(
        fs.existsSync(path.join(projectDir, '.claude', 'settings.json'))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(projectDir, '.claude', '.gitignore'))
      ).toBe(true);
    });
  });
});
