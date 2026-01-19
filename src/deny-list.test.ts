import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isDenied, loadDenyPatterns } from './deny-list.js';

describe('deny-list', () => {
  describe('loadDenyPatterns', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-deny-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('loads patterns from deny-list.project.txt', () => {
      fs.writeFileSync(
        path.join(tempDir, 'deny-list.project.txt'),
        '*.secret\n/private/**\n'
      );

      const result = loadDenyPatterns(tempDir);

      expect(result).toEqual(['*.secret', '/private/**']);
    });

    it('returns empty array when no deny list files exist', () => {
      const result = loadDenyPatterns(tempDir);

      expect(result).toEqual([]);
    });

    it('ignores empty lines and comments', () => {
      fs.writeFileSync(
        path.join(tempDir, 'deny-list.project.txt'),
        '*.secret\n\n# This is a comment\n/private/**\n'
      );

      const result = loadDenyPatterns(tempDir);

      expect(result).toEqual(['*.secret', '/private/**']);
    });

    it('loads and merges patterns from deny-list.local.txt', () => {
      fs.writeFileSync(
        path.join(tempDir, 'deny-list.project.txt'),
        '*.secret\n'
      );
      fs.writeFileSync(
        path.join(tempDir, 'deny-list.local.txt'),
        '/my-local/**\n'
      );

      const result = loadDenyPatterns(tempDir);

      expect(result).toEqual(['*.secret', '/my-local/**']);
    });

    it('loads only local patterns when project file does not exist', () => {
      fs.writeFileSync(
        path.join(tempDir, 'deny-list.local.txt'),
        '/my-local/**\n'
      );

      const result = loadDenyPatterns(tempDir);

      expect(result).toEqual(['/my-local/**']);
    });
  });

  describe('isDenied', () => {
    it('returns true when path matches a glob pattern', () => {
      const patterns = ['*.secret', '/private/**'];

      const result = isDenied('/config/api.secret', patterns);

      expect(result).toBe(true);
    });

    it('returns false when path does not match any pattern', () => {
      const patterns = ['*.secret', '/private/**'];

      const result = isDenied('/config/api.json', patterns);

      expect(result).toBe(false);
    });

    it('returns false when patterns array is empty', () => {
      const result = isDenied('/any/path.txt', []);

      expect(result).toBe(false);
    });
  });
});
