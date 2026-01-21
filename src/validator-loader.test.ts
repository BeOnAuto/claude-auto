import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadValidators } from './validator-loader.js';

describe('loadValidators', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-validators-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when directory does not exist', () => {
    const nonExistentDir = path.join(tempDir, 'validators');

    const result = loadValidators([nonExistentDir]);

    expect(result).toEqual([]);
  });

  it('parses single .md file with frontmatter', () => {
    const validatorsDir = path.join(tempDir, 'validators');
    fs.mkdirSync(validatorsDir);
    const validatorContent = `---
name: test-validator
description: A test validator
enabled: true
---

Check that tests pass.

Respond with JSON: {"decision":"ACK"} or {"decision":"NACK","reason":"..."}`;
    fs.writeFileSync(path.join(validatorsDir, 'test.md'), validatorContent);

    const result = loadValidators([validatorsDir]);

    expect(result).toEqual([
      {
        name: 'test-validator',
        description: 'A test validator',
        enabled: true,
        content: 'Check that tests pass.\n\nRespond with JSON: {"decision":"ACK"} or {"decision":"NACK","reason":"..."}',
        path: path.join(validatorsDir, 'test.md'),
      },
    ]);
  });

  it('filters disabled validators', () => {
    const validatorsDir = path.join(tempDir, 'validators');
    fs.mkdirSync(validatorsDir);
    fs.writeFileSync(
      path.join(validatorsDir, 'enabled.md'),
      `---
name: enabled-validator
description: Enabled
enabled: true
---
Content`
    );
    fs.writeFileSync(
      path.join(validatorsDir, 'disabled.md'),
      `---
name: disabled-validator
description: Disabled
enabled: false
---
Content`
    );

    const result = loadValidators([validatorsDir]);

    expect(result).toEqual([
      {
        name: 'enabled-validator',
        description: 'Enabled',
        enabled: true,
        content: 'Content',
        path: path.join(validatorsDir, 'enabled.md'),
      },
    ]);
  });

  it('loads from multiple directories', () => {
    const dir1 = path.join(tempDir, 'validators1');
    const dir2 = path.join(tempDir, 'validators2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    fs.writeFileSync(
      path.join(dir1, 'first.md'),
      `---
name: first
description: First validator
enabled: true
---
First content`
    );
    fs.writeFileSync(
      path.join(dir2, 'second.md'),
      `---
name: second
description: Second validator
enabled: true
---
Second content`
    );

    const result = loadValidators([dir1, dir2]);

    expect(result).toEqual([
      {
        name: 'first',
        description: 'First validator',
        enabled: true,
        content: 'First content',
        path: path.join(dir1, 'first.md'),
      },
      {
        name: 'second',
        description: 'Second validator',
        enabled: true,
        content: 'Second content',
        path: path.join(dir2, 'second.md'),
      },
    ]);
  });
});
