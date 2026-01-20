import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleSessionStart } from './session-start.js';

describe('session-start hook', () => {
  let tempDir: string;
  const originalEnv = process.env.DEBUG;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-session-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalEnv;
    }
  });

  it('outputs filtered skills content for SessionStart hook', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'my-skill.md'),
      `---
hook: SessionStart
priority: 10
---

# My Skill

This is the skill content.`
    );

    const result = handleSessionStart(tempDir);

    expect(result).toEqual({
      result: '# My Skill\n\nThis is the skill content.',
    });
  });

  it('logs skills loaded when DEBUG=ketchup', () => {
    process.env.DEBUG = 'ketchup';
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'skill-a.md'),
      `---
hook: SessionStart
priority: 10
---

Skill A content.`
    );
    fs.writeFileSync(
      path.join(skillsDir, 'skill-b.md'),
      `---
hook: PreToolUse
---

Skill B content.`
    );

    handleSessionStart(tempDir);

    const logPath = path.join(tempDir, 'logs', 'ketchup.log');
    expect(fs.existsSync(logPath)).toBe(true);
    const content = fs.readFileSync(logPath, 'utf8');
    expect(content).toContain('[session-start]');
    expect(content).toContain('scanned 2 skills');
    expect(content).toContain('filtered to 1 for SessionStart');
  });
});
