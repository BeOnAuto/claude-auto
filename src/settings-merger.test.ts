import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mergeSettings } from './settings-merger.js';

describe('settings-merger', () => {
  describe('mergeSettings', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('copies package settings to target when no existing settings', () => {
      const packageDir = path.join(tempDir, 'package');
      const targetDir = path.join(tempDir, 'target');
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });
      const packageSettings = { hooks: { SessionStart: [] } };
      fs.writeFileSync(
        path.join(packageDir, 'templates', 'settings.json'),
        JSON.stringify(packageSettings)
      );

      mergeSettings(packageDir, targetDir);

      const result = JSON.parse(
        fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8')
      );
      expect(result).toEqual(packageSettings);
    });

    it('does nothing when package settings do not exist', () => {
      const packageDir = path.join(tempDir, 'package');
      const targetDir = path.join(tempDir, 'target');
      fs.mkdirSync(packageDir, { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      mergeSettings(packageDir, targetDir);

      expect(fs.existsSync(path.join(targetDir, 'settings.json'))).toBe(false);
    });

    it('deep merges settings.project.json over package settings', () => {
      const packageDir = path.join(tempDir, 'package');
      const targetDir = path.join(tempDir, 'target');
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      const packageSettings = {
        hooks: {
          SessionStart: [{ hooks: [{ type: 'command', command: 'pkg-cmd' }] }],
        },
      };
      const projectSettings = {
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'project-cmd' }] },
          ],
        },
      };

      fs.writeFileSync(
        path.join(packageDir, 'templates', 'settings.json'),
        JSON.stringify(packageSettings)
      );
      fs.writeFileSync(
        path.join(targetDir, 'settings.project.json'),
        JSON.stringify(projectSettings)
      );

      mergeSettings(packageDir, targetDir);

      const result = JSON.parse(
        fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8')
      );
      expect(result).toEqual({
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'pkg-cmd' }] },
            { hooks: [{ type: 'command', command: 'project-cmd' }] },
          ],
        },
      });
    });

    it('removes hooks listed in _disabled array', () => {
      const packageDir = path.join(tempDir, 'package');
      const targetDir = path.join(tempDir, 'target');
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      const packageSettings = {
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'cmd-a' }] },
            { hooks: [{ type: 'command', command: 'cmd-b' }] },
            { hooks: [{ type: 'command', command: 'cmd-c' }] },
          ],
        },
      };
      const projectSettings = {
        hooks: {
          SessionStart: {
            _disabled: ['cmd-b'],
          },
        },
      };

      fs.writeFileSync(
        path.join(packageDir, 'templates', 'settings.json'),
        JSON.stringify(packageSettings)
      );
      fs.writeFileSync(
        path.join(targetDir, 'settings.project.json'),
        JSON.stringify(projectSettings)
      );

      mergeSettings(packageDir, targetDir);

      const result = JSON.parse(
        fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8')
      );
      expect(result).toEqual({
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'cmd-a' }] },
            { hooks: [{ type: 'command', command: 'cmd-c' }] },
          ],
        },
      });
    });

    it('deep merges settings.local.json over project and package settings', () => {
      const packageDir = path.join(tempDir, 'package');
      const targetDir = path.join(tempDir, 'target');
      fs.mkdirSync(path.join(packageDir, 'templates'), { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      const packageSettings = {
        hooks: {
          SessionStart: [{ hooks: [{ type: 'command', command: 'pkg-cmd' }] }],
        },
      };
      const projectSettings = {
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'project-cmd' }] },
          ],
        },
      };
      const localSettings = {
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'local-cmd' }] },
          ],
        },
      };

      fs.writeFileSync(
        path.join(packageDir, 'templates', 'settings.json'),
        JSON.stringify(packageSettings)
      );
      fs.writeFileSync(
        path.join(targetDir, 'settings.project.json'),
        JSON.stringify(projectSettings)
      );
      fs.writeFileSync(
        path.join(targetDir, 'settings.local.json'),
        JSON.stringify(localSettings)
      );

      mergeSettings(packageDir, targetDir);

      const result = JSON.parse(
        fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8')
      );
      expect(result).toEqual({
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'pkg-cmd' }] },
            { hooks: [{ type: 'command', command: 'project-cmd' }] },
            { hooks: [{ type: 'command', command: 'local-cmd' }] },
          ],
        },
      });
    });
  });
});
