import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isStatusLineConfigured, setupStatusLine } from './statusline-detector.js';

describe('isStatusLineConfigured', () => {
  let tempDir: string;
  let settingsPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statusline-'));
    settingsPath = path.join(tempDir, 'settings.json');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false when settings file does not exist', () => {
    const result = isStatusLineConfigured(path.join(tempDir, 'nonexistent.json'));

    expect(result).toBe(false);
  });

  it('returns false when settings has no statusLine key', () => {
    fs.writeFileSync(settingsPath, JSON.stringify({ theme: 'dark' }));

    const result = isStatusLineConfigured(settingsPath);

    expect(result).toBe(false);
  });

  it('returns true when settings has statusLine key', () => {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        statusLine: { type: 'command', command: 'sh /path/to/script.sh' },
      }),
    );

    const result = isStatusLineConfigured(settingsPath);

    expect(result).toBe(true);
  });

  it('returns false when settings file contains invalid JSON', () => {
    fs.writeFileSync(settingsPath, 'not json');

    const result = isStatusLineConfigured(settingsPath);

    expect(result).toBe(false);
  });
});

describe('setupStatusLine', () => {
  let tempDir: string;
  let settingsPath: string;
  let scriptSource: string;
  let scriptDest: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statusline-setup-'));
    settingsPath = path.join(tempDir, 'settings.json');
    scriptSource = path.join(tempDir, 'source', 'statusline.sh');
    scriptDest = path.join(tempDir, 'dest', 'statusline-command.sh');
    fs.mkdirSync(path.join(tempDir, 'source'), { recursive: true });
    fs.writeFileSync(scriptSource, '#!/bin/sh\necho "status"');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('copies script and creates settings when none exist', () => {
    setupStatusLine(scriptSource, scriptDest, settingsPath);

    expect(fs.readFileSync(scriptDest, 'utf-8')).toBe('#!/bin/sh\necho "status"');
    expect(JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))).toEqual({
      statusLine: { type: 'command', command: `sh ${scriptDest}` },
    });
  });

  it('merges statusLine into existing settings', () => {
    fs.writeFileSync(settingsPath, JSON.stringify({ skipDangerousModePermissionPrompt: true }));

    setupStatusLine(scriptSource, scriptDest, settingsPath);

    expect(JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))).toEqual({
      skipDangerousModePermissionPrompt: true,
      statusLine: { type: 'command', command: `sh ${scriptDest}` },
    });
  });

  it('overwrites existing statusLine config', () => {
    fs.writeFileSync(settingsPath, JSON.stringify({ statusLine: { type: 'command', command: 'sh /old/script.sh' } }));

    setupStatusLine(scriptSource, scriptDest, settingsPath);

    expect(JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))).toEqual({
      statusLine: { type: 'command', command: `sh ${scriptDest}` },
    });
  });

  it('creates destination directory if it does not exist', () => {
    const deepDest = path.join(tempDir, 'a', 'b', 'statusline-command.sh');

    setupStatusLine(scriptSource, deepDest, settingsPath);

    expect(fs.existsSync(deepDest)).toBe(true);
  });
});
