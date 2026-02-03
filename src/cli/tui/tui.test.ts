import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTui } from './tui.js';

describe('createTui', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tui-'));
    const ketchupDir = path.join(tempDir, '.ketchup');
    fs.mkdirSync(path.join(ketchupDir, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ketchupDir, '.claude.hooks.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('renders screen content with banner and log section', () => {
    fs.writeFileSync(path.join(tempDir, '.ketchup', 'logs', 'activity.log'), 'test-entry\n');

    const writes: string[] = [];
    const tui = createTui({
      dir: tempDir,
      write: (s) => writes.push(s),
      cols: 80,
      rows: 24,
    });

    tui.render();
    tui.stop();

    const output = writes.join('');
    expect({
      containsEntry: output.includes('test-entry'),
      hasBanner: output.includes('█'),
      hasContent: output.length > 0,
    }).toEqual({
      containsEntry: true,
      hasBanner: true,
      hasContent: true,
    });
  });

  it('renders waiting message when no logs exist', () => {
    const writes: string[] = [];
    const tui = createTui({
      dir: tempDir,
      write: (s) => writes.push(s),
      cols: 80,
      rows: 24,
    });

    tui.render();
    tui.stop();

    const output = writes.join('');
    expect(output.includes('waiting')).toBe(true);
  });

  it('resize updates dimensions and re-renders', () => {
    fs.writeFileSync(path.join(tempDir, '.ketchup', 'logs', 'activity.log'), 'resize-test\n');

    const writes: string[] = [];
    const tui = createTui({
      dir: tempDir,
      write: (s) => writes.push(s),
      cols: 80,
      rows: 24,
    });

    writes.length = 0;
    tui.resize(120, 40);
    tui.stop();

    expect({
      reRendered: writes.length > 0,
      containsEntry: writes.join('').includes('resize-test'),
    }).toEqual({
      reRendered: true,
      containsEntry: true,
    });
  });

  it('stop cleans up resources', () => {
    const tui = createTui({
      dir: tempDir,
      write: () => {},
      cols: 80,
      rows: 24,
    });

    tui.stop();
    expect(tui.isStopped()).toBe(true);
  });
});
