import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readState, writeState } from './state-manager.js';

describe('state-manager', () => {
  describe('readState', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-state-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('reads state from state.json', () => {
      const stateData = { lastRun: '2024-01-01', counter: 5 };
      fs.writeFileSync(path.join(tempDir, 'state.json'), JSON.stringify(stateData));

      const result = readState(tempDir);

      expect(result).toEqual(stateData);
    });

    it('returns empty object when state.json does not exist', () => {
      const result = readState(tempDir);

      expect(result).toEqual({});
    });
  });

  describe('writeState', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-state-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('writes state to state.json', () => {
      const stateData = { lastRun: '2024-01-01', counter: 5 };

      writeState(tempDir, stateData);

      const result = JSON.parse(fs.readFileSync(path.join(tempDir, 'state.json'), 'utf-8'));
      expect(result).toEqual(stateData);
    });

    it('creates backup before overwriting existing state', () => {
      const initialState = { counter: 1 };
      const newState = { counter: 2 };
      fs.writeFileSync(path.join(tempDir, 'state.json'), JSON.stringify(initialState));

      writeState(tempDir, newState);

      const backup = JSON.parse(fs.readFileSync(path.join(tempDir, 'state.backup.json'), 'utf-8'));
      expect(backup).toEqual(initialState);
    });
  });
});
