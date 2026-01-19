import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSymlink, getPackageDir, isLinkedMode } from './linker.js';

describe('linker', () => {
  describe('getPackageDir', () => {
    it('returns the directory containing this package', () => {
      const result = getPackageDir();
      expect(result).toBe(path.resolve(__dirname, '..'));
    });
  });

  describe('isLinkedMode', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when package is a symlink in node_modules', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const nodeModules = path.join(projectDir, 'node_modules');
      const packagePath = path.join(nodeModules, 'claude-ketchup');
      const realPackage = path.join(tempDir, 'real-package');

      fs.mkdirSync(realPackage, { recursive: true });
      fs.mkdirSync(nodeModules, { recursive: true });
      fs.symlinkSync(realPackage, packagePath);

      const result = isLinkedMode(packagePath);
      expect(result).toBe(true);
    });

    it('returns false when package is a regular directory', () => {
      const projectDir = path.join(tempDir, 'my-project');
      const nodeModules = path.join(projectDir, 'node_modules');
      const packagePath = path.join(nodeModules, 'claude-ketchup');

      fs.mkdirSync(packagePath, { recursive: true });

      const result = isLinkedMode(packagePath);
      expect(result).toBe(false);
    });
  });

  describe('createSymlink', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('creates a symlink to the source file', () => {
      const sourceFile = path.join(tempDir, 'source.txt');
      const targetLink = path.join(tempDir, 'target.txt');
      fs.writeFileSync(sourceFile, 'content');

      createSymlink(sourceFile, targetLink);

      expect(fs.lstatSync(targetLink).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(targetLink)).toBe(sourceFile);
    });
  });
});
