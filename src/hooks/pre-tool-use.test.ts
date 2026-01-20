import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handlePreToolUse } from './pre-tool-use.js';

describe('pre-tool-use hook', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-pretool-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('blocks tool use when path matches deny pattern', () => {
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.secret' };

    const result = handlePreToolUse(tempDir, toolInput);

    expect(result).toEqual({
      decision: 'block',
      reason: 'Path /project/config.secret is denied by ketchup deny-list',
    });
  });

  it('allows tool use when path does not match deny pattern', () => {
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.json' };

    const result = handlePreToolUse(tempDir, toolInput);

    expect(result).toEqual({ decision: 'allow' });
  });

  it('logs deny-list check when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    fs.writeFileSync(
      path.join(tempDir, 'deny-list.project.txt'),
      '*.secret\n'
    );
    const toolInput = { file_path: '/project/config.secret' };

    handlePreToolUse(tempDir, toolInput);

    const logPath = path.join(tempDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[pre-tool-use]');
    expect(content).toContain('/project/config.secret');
    expect(content).toContain('blocked');
  });
});
