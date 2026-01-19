import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleUserPromptSubmit } from './user-prompt-submit.js';

describe('user-prompt-submit hook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-prompt-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('injects reminder skills into user prompt', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'reminder.md'),
      `---
hook: UserPromptSubmit
priority: 10
---

Remember to follow coding standards.`
    );

    const result = handleUserPromptSubmit(tempDir, 'Help me fix this bug');

    expect(result).toEqual({
      result: 'Help me fix this bug\n\n<system-reminder>\nRemember to follow coding standards.\n</system-reminder>',
    });
  });

  it('returns prompt unchanged when no reminder skills exist', () => {
    const result = handleUserPromptSubmit(tempDir, 'Help me fix this bug');

    expect(result).toEqual({ result: 'Help me fix this bug' });
  });
});
