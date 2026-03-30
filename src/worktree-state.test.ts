import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createWorktreeState, type WorktreeInfo, type WorktreeState } from './worktree-state.js';

describe('worktree-state', () => {
  let tempDir: string;
  let autoDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-auto-worktreestate-'));
    autoDir = path.join(tempDir, '.claude-auto');
    fs.mkdirSync(autoDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const makeWorktree = (overrides: Partial<WorktreeInfo> = {}): WorktreeInfo => ({
    id: 'wt-1',
    path: '/tmp/worktrees/feature-a',
    branch: 'feature-a',
    baseBranch: 'main',
    status: 'active',
    createdAt: '2026-03-25T00:00:00Z',
    ...overrides,
  });

  describe('read', () => {
    it('returns empty state when file does not exist', () => {
      const manager = createWorktreeState(autoDir);
      const state = manager.read();

      expect(state).toEqual({ worktrees: {} });
    });

    it('returns persisted state when file exists', () => {
      const existing: WorktreeState = {
        worktrees: {
          'wt-1': makeWorktree(),
        },
        defaultBasePath: '/tmp/worktrees',
      };
      fs.writeFileSync(path.join(autoDir, '.worktrees.json'), JSON.stringify(existing));

      const manager = createWorktreeState(autoDir);
      const state = manager.read();

      expect(state).toEqual(existing);
    });
  });

  describe('write', () => {
    it('persists state to disk', () => {
      const manager = createWorktreeState(autoDir);
      const state: WorktreeState = {
        worktrees: {
          'wt-1': makeWorktree(),
        },
        defaultBasePath: '/tmp/worktrees',
      };

      manager.write(state);

      const content = JSON.parse(fs.readFileSync(path.join(autoDir, '.worktrees.json'), 'utf-8'));
      expect(content).toEqual(state);
    });
  });

  describe('addWorktree', () => {
    it('adds a new worktree record', () => {
      const manager = createWorktreeState(autoDir);
      const info = makeWorktree();

      manager.addWorktree(info);

      const state = manager.read();
      expect(state.worktrees['wt-1']).toEqual(info);
    });
  });

  describe('removeWorktree', () => {
    it('removes a worktree by id', () => {
      const manager = createWorktreeState(autoDir);
      manager.addWorktree(makeWorktree({ id: 'wt-1' }));
      manager.addWorktree(makeWorktree({ id: 'wt-2', branch: 'feature-b' }));

      manager.removeWorktree('wt-1');

      const state = manager.read();
      expect(state.worktrees['wt-1']).toBeUndefined();
      expect(state.worktrees['wt-2']).toEqual(makeWorktree({ id: 'wt-2', branch: 'feature-b' }));
    });
  });

  describe('updateWorktree', () => {
    it('partially updates a worktree', () => {
      const manager = createWorktreeState(autoDir);
      manager.addWorktree(makeWorktree());

      manager.updateWorktree('wt-1', { status: 'merged', sessionId: 'sess-123' });

      const state = manager.read();
      expect(state.worktrees['wt-1']).toEqual({
        ...makeWorktree(),
        status: 'merged',
        sessionId: 'sess-123',
      });
    });
  });

  describe('getWorktree', () => {
    it('returns undefined for non-existent id', () => {
      const manager = createWorktreeState(autoDir);

      expect(manager.getWorktree('non-existent')).toBeUndefined();
    });

    it('returns the worktree info for existing id', () => {
      const manager = createWorktreeState(autoDir);
      const info = makeWorktree();
      manager.addWorktree(info);

      expect(manager.getWorktree('wt-1')).toEqual(info);
    });
  });

  describe('autoDir creation', () => {
    it('creates autoDir if it does not exist', () => {
      const newAutoDir = path.join(tempDir, 'new-auto-dir');
      expect(fs.existsSync(newAutoDir)).toBe(false);

      createWorktreeState(newAutoDir);

      expect(fs.existsSync(newAutoDir)).toBe(true);
    });
  });
});
