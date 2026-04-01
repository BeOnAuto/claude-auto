import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runSetupStatusLine } from './setup-statusline.js';

describe('runSetupStatusLine', () => {
  let tempDir: string;
  let pluginRoot: string;
  let homeDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-statusline-'));
    pluginRoot = path.join(tempDir, 'plugin');
    homeDir = path.join(tempDir, 'home');
    fs.mkdirSync(path.join(pluginRoot, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(pluginRoot, 'scripts', 'statusline.sh'), '#!/bin/sh\necho test');
    fs.mkdirSync(path.join(homeDir, '.claude'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('configures statusline when not already set up', () => {
    const result = runSetupStatusLine(pluginRoot, homeDir);

    const expectedDest = path.join(homeDir, '.claude', 'statusline-command.sh');
    const expectedSettings = path.join(homeDir, '.claude', 'settings.json');
    expect(result).toEqual({
      status: 'configured',
      scriptDest: expectedDest,
      settingsPath: expectedSettings,
    });
    expect(fs.existsSync(expectedDest)).toBe(true);
    expect(JSON.parse(fs.readFileSync(expectedSettings, 'utf-8'))).toEqual({
      statusLine: { type: 'command', command: `sh ${expectedDest}` },
    });
  });

  it('returns already-configured when statusLine exists in settings', () => {
    const settingsPath = path.join(homeDir, '.claude', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({ statusLine: { type: 'command', command: 'sh /existing.sh' } }));

    const result = runSetupStatusLine(pluginRoot, homeDir);

    expect(result).toEqual({
      status: 'already-configured',
      settingsPath,
    });
  });
});
