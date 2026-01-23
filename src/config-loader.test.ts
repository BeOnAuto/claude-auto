import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadConfig } from './config-loader.js';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-config-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty object when no config exists', async () => {
    const result = await loadConfig(tempDir);

    expect(result).toEqual({});
  });

  it('reads config from .ketchuprc.json', async () => {
    const config = { validators: { enabled: true, mode: 'warn' } };
    fs.writeFileSync(path.join(tempDir, '.ketchuprc.json'), JSON.stringify(config));

    const result = await loadConfig(tempDir);

    expect(result).toEqual({ validators: { enabled: true, mode: 'warn' } });
  });

  it('reads config from package.json ketchup key', async () => {
    const packageJson = {
      name: 'test-project',
      ketchup: { validators: { dirs: ['custom-validators'] } },
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = await loadConfig(tempDir);

    expect(result).toEqual({ validators: { dirs: ['custom-validators'] } });
  });
});
