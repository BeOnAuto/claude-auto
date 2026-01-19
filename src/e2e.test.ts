import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runPostinstall } from './postinstall.js';
import { runPreuninstall } from './preuninstall.js';

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

      fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'skills'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });

      fs.writeFileSync(
        path.join(packageDir, 'scripts', 'session-start.ts'),
        'export default {}'
      );
      fs.writeFileSync(
        path.join(packageDir, 'skills', 'my-skill.md'),
        '# Skill'
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

    it('installs and uninstalls cleanly', () => {
      const result = runPostinstall(packageDir);

      expect(result.projectRoot).toBe(projectDir);
      expect(result.claudeDir).toBe(path.join(projectDir, '.claude'));
      expect(result.symlinkedFiles).toEqual([
        'scripts/session-start.ts',
        'skills/my-skill.md',
      ]);

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
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
        fs.existsSync(path.join(projectDir, '.claude', 'settings.json'))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(projectDir, '.claude', '.gitignore'))
      ).toBe(true);

      runPreuninstall();

      expect(
        fs.existsSync(
          path.join(projectDir, '.claude', 'scripts', 'session-start.ts')
        )
      ).toBe(false);
      expect(
        fs.existsSync(
          path.join(projectDir, '.claude', 'skills', 'my-skill.md')
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
