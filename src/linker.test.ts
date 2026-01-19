import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getPackageDir } from './linker.js';

describe('linker', () => {
  describe('getPackageDir', () => {
    it('returns the directory containing this package', () => {
      const result = getPackageDir();
      expect(result).toBe(path.resolve(__dirname, '..'));
    });
  });
});
