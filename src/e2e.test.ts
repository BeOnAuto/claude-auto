import { execSync, spawnSync } from 'node:child_process';
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
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-e2e-'));
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
      expect(fs.existsSync(path.join(projectDir, '.claude-auto'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.claude', 'settings.json'))).toBe(true);

      // Scripts are regular files in .claude-auto/scripts, not symlinks
      const scriptPath = path.join(projectDir, '.claude-auto', 'scripts', 'session-start.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.lstatSync(scriptPath).isSymbolicLink()).toBe(false);

      // Reminders are regular files, not symlinks
      const reminderFiles = fs.readdirSync(path.join(projectDir, '.claude-auto', 'reminders'));
      expect(reminderFiles.length).toBeGreaterThan(0);
      for (const file of reminderFiles) {
        expect(fs.lstatSync(path.join(projectDir, '.claude-auto', 'reminders', file)).isSymbolicLink()).toBe(false);
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

  describe('multi-repo scenario', () => {
    let tempDir: string;
    let parentDir: string;
    let repoDir: string;

    beforeEach(() => {
      // Create temp directory structure OUTSIDE of this repo
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-multirepo-'));
      parentDir = path.join(tempDir, 'parent');
      repoDir = path.join(parentDir, 'repo1');
      fs.mkdirSync(repoDir, { recursive: true });

      // Initialize git repo in repo1
      execSync('git init', { cwd: repoDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', { cwd: repoDir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: repoDir, stdio: 'pipe' });

      // Create and stage a .ts file
      fs.writeFileSync(path.join(repoDir, 'file.ts'), 'export const x = 1;');
      execSync('git add file.ts', { cwd: repoDir, stdio: 'pipe' });
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('pre-tool-use hook works when command includes cd to repo', async () => {
      // Install claude-auto in parent (which is NOT a git repo)
      await install(parentDir);

      // Copy the built pre-tool-use.js script
      const builtScript = path.join(__dirname, '..', 'dist', 'bundle', 'scripts', 'pre-tool-use.js');
      const targetScript = path.join(parentDir, '.claude-auto', 'scripts', 'pre-tool-use.js');
      fs.copyFileSync(builtScript, targetScript);

      // Simulate hook input: cwd is parent, command does cd into repo
      const hookInput = JSON.stringify({
        session_id: 'test-session',
        cwd: parentDir,
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: {
          command: `cd ${repoDir} && git add file.ts && git commit -m "test: add file"`,
        },
      });

      // Run the hook script from the parent directory (simulating Claude Code's behavior)
      const result = spawnSync('node', [targetScript], {
        cwd: parentDir,
        input: hookInput,
        encoding: 'utf-8',
        timeout: 30000,
      });

      // Hook should NOT crash - it should return valid JSON
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');

      // Parse and verify the output
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('hookSpecificOutput');
      expect(output.hookSpecificOutput).toHaveProperty('hookEventName', 'PreToolUse');
      expect(output.hookSpecificOutput).toHaveProperty('permissionDecision');
      expect(['allow', 'deny']).toContain(output.hookSpecificOutput.permissionDecision);
    });

    it('pre-tool-use hook works when run from git repo subdirectory without cd prefix', async () => {
      // Install claude-auto in parent (which is NOT a git repo)
      await install(parentDir);

      // Copy the built pre-tool-use.js script
      const builtScript = path.join(__dirname, '..', 'dist', 'bundle', 'scripts', 'pre-tool-use.js');
      const targetScript = path.join(parentDir, '.claude-auto', 'scripts', 'pre-tool-use.js');
      fs.copyFileSync(builtScript, targetScript);

      // Simulate hook input: cwd is the REPO directory, command has no cd
      // This is the scenario where Claude is working inside the repo
      const hookInput = JSON.stringify({
        session_id: 'test-session',
        cwd: repoDir,
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: {
          command: 'git add file.ts && git commit -m "test: add file"',
        },
      });

      // Run the hook script from the PARENT directory (where claude-auto is installed)
      // but with cwd in the input pointing to the repo
      const result = spawnSync('node', [targetScript], {
        cwd: parentDir, // Hook runs from parent (where it's installed)
        input: hookInput,
        encoding: 'utf-8',
        timeout: 30000,
      });

      // Hook should NOT crash - it should return valid JSON
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');

      // Parse and verify the output
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('hookSpecificOutput');
      expect(output.hookSpecificOutput).toHaveProperty('hookEventName', 'PreToolUse');
      expect(output.hookSpecificOutput).toHaveProperty('permissionDecision');
      expect(['allow', 'deny']).toContain(output.hookSpecificOutput.permissionDecision);
    });
  });
});
