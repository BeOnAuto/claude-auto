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
  });
});
