import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleSessionStart } from './session-start.js';

describe('session-start hook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-session-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
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
});
