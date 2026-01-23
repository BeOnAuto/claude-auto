import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KETCHUP_DIR } from './config-loader.js';
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

    it('detects project root and returns it', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'empty-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(packageDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result).toEqual({
        projectRoot: projectDir,
        claudeDir: path.join(projectDir, '.claude'),
        ketchupDir: path.join(projectDir, DEFAULT_KETCHUP_DIR),
        symlinkedFiles: [],
      });
    });

    it('creates .claude directory in project root', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      await runPostinstall();

      expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
      expect(fs.statSync(path.join(projectDir, '.claude')).isDirectory()).toBe(true);
    });

    it('creates ketchup directory in project root', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      await runPostinstall();

      expect(fs.existsSync(path.join(projectDir, DEFAULT_KETCHUP_DIR))).toBe(true);
      expect(fs.statSync(path.join(projectDir, DEFAULT_KETCHUP_DIR)).isDirectory()).toBe(true);
    });

    it('symlinks files from package dist/scripts/ and commands/ to .claude/', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'commands'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js'), 'export default {}');
      fs.writeFileSync(path.join(packageDir, 'commands', 'my-command.md'), '# Command');
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result.symlinkedFiles).toContain('scripts/session-start.js');
      expect(result.symlinkedFiles).toContain('commands/my-command.md');
      expect(fs.lstatSync(path.join(projectDir, '.claude', 'scripts', 'session-start.js')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(path.join(projectDir, '.claude', 'commands', 'my-command.md')).isSymbolicLink()).toBe(true);
    });

    it('symlinks only .js files from dist/scripts, not .d.ts or .map files', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js'), 'export default {}');
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.d.ts'), 'export default {}');
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.d.ts.map'), '{}');
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js.map'), '{}');
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result.symlinkedFiles).toContain('scripts/session-start.js');
      expect(result.symlinkedFiles).not.toContain('scripts/session-start.d.ts');
      expect(fs.existsSync(path.join(projectDir, '.claude', 'scripts', 'session-start.d.ts'))).toBe(false);
      expect(fs.existsSync(path.join(projectDir, '.claude', 'scripts', 'session-start.js.map'))).toBe(false);
    });

    it('generates .gitignore in .claude directory with symlinked files and runtime patterns', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js'), 'export default {}');
      process.env.KETCHUP_ROOT = projectDir;

      await runPostinstall(packageDir);

      const gitignoreContent = fs.readFileSync(path.join(projectDir, '.claude', '.gitignore'), 'utf-8');
      expect(gitignoreContent).toBe(['scripts/session-start.js', '*.local.*', 'state.json', 'logs/'].join('\n'));
    });

    it('does not include ketchup files (validators/reminders) in .claude/.gitignore', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'dist', 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
      fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'dist', 'scripts', 'session-start.js'), 'export default {}');
      fs.writeFileSync(path.join(packageDir, 'validators', 'my-rule.md'), '---\nname: my-rule\n---\nContent');
      fs.writeFileSync(path.join(packageDir, 'reminders', 'my-reminder.md'), '---\npriority: 100\n---\nContent');
      process.env.KETCHUP_ROOT = projectDir;

      await runPostinstall(packageDir);

      const gitignoreContent = fs.readFileSync(path.join(projectDir, '.claude', '.gitignore'), 'utf-8');
      expect(gitignoreContent).not.toContain('validators');
      expect(gitignoreContent).not.toContain('reminders');
      expect(gitignoreContent).toBe(['scripts/session-start.js', '*.local.*', 'state.json', 'logs/'].join('\n'));
    });

    it('symlinks files from package validators/ to ketchup/validators/', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'validators'), { recursive: true });
      fs.writeFileSync(
        path.join(packageDir, 'validators', 'ketchup-rules.md'),
        '---\nname: ketchup-rules\n---\nContent',
      );
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result.symlinkedFiles).toContain(`${DEFAULT_KETCHUP_DIR}/validators/ketchup-rules.md`);
      expect(
        fs.lstatSync(path.join(projectDir, DEFAULT_KETCHUP_DIR, 'validators', 'ketchup-rules.md')).isSymbolicLink(),
      ).toBe(true);
    });

    it('symlinks files from package reminders/ to ketchup/reminders/', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'reminders', 'ketchup.md'), '---\npriority: 100\n---\nContent');
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result.symlinkedFiles).toContain(`${DEFAULT_KETCHUP_DIR}/reminders/ketchup.md`);
      expect(fs.lstatSync(path.join(projectDir, DEFAULT_KETCHUP_DIR, 'reminders', 'ketchup.md')).isSymbolicLink()).toBe(
        true,
      );
    });

    it('uses custom ketchupDir from config', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(projectDir, '.ketchuprc.json'), JSON.stringify({ ketchupDir: '.ketchup-custom' }));
      fs.mkdirSync(path.join(packageDir, 'reminders'), { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'reminders', 'test.md'), '---\npriority: 100\n---\nContent');
      process.env.KETCHUP_ROOT = projectDir;

      const result = await runPostinstall(packageDir);

      expect(result.ketchupDir).toBe(path.join(projectDir, '.ketchup-custom'));
      expect(result.symlinkedFiles).toContain('.ketchup-custom/reminders/test.md');
      expect(fs.lstatSync(path.join(projectDir, '.ketchup-custom', 'reminders', 'test.md')).isSymbolicLink()).toBe(
        true,
      );
    });

    it('merges settings from package templates to .claude directory', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const packageDir = path.join(tempDir, 'ketchup-package');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });
      const packageSettings = { hooks: { SessionStart: [] } };
      fs.writeFileSync(path.join(packageDir, 'templates', 'settings.json'), JSON.stringify(packageSettings));
      process.env.KETCHUP_ROOT = projectDir;

      await runPostinstall(packageDir);

      const result = JSON.parse(fs.readFileSync(path.join(projectDir, '.claude', 'settings.json'), 'utf-8'));
      expect(result).toEqual(packageSettings);
    });
  });
});
