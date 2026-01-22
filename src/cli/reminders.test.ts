import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listReminders } from './reminders.js';

describe('cli reminders', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-reminders-cli-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('lists reminders with their metadata', () => {
    const remindersDir = path.join(tempDir, 'reminders');
    fs.mkdirSync(remindersDir, { recursive: true });
    fs.writeFileSync(
      path.join(remindersDir, 'plan-mode.md'),
      `---
when:
  hook: SessionStart
  mode: plan
priority: 100
---

Ask clarifying questions.`
    );

    const result = listReminders(remindersDir);

    expect(result).toEqual({
      reminders: [
        {
          name: 'plan-mode',
          when: { hook: 'SessionStart', mode: 'plan' },
          priority: 100,
        },
      ],
    });
  });
});
