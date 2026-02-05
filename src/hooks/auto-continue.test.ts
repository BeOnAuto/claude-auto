import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ClueCollectorResult } from '../clue-collector.js';
import { buildPrompt, getIncompleteBursts, handleStop, type StopHookInput } from './auto-continue.js';

describe('auto-continue hook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-autocontinue-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getIncompleteBursts', () => {
    it('returns zero count when file does not exist', () => {
      const result = getIncompleteBursts('/nonexistent/path.md');

      expect(result).toEqual({
        count: 0,
        path: '/nonexistent/path.md',
        todoSection: '',
      });
    });

    it('counts unchecked items in ketchup plan', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(
        planPath,
        `# Ketchup Plan

## TODO

- [ ] Burst 1: First task
- [ ] Burst 2: Second task

## DONE

- [x] Burst 0: Setup
`,
      );

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(2);
      expect(result.path).toBe(planPath);
      expect(result.todoSection).toContain('Burst 1');
    });

    it('returns zero count when all items checked', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(
        planPath,
        `# Ketchup Plan

## TODO

## DONE

- [x] Burst 1: Complete
`,
      );

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(0);
      expect(result.todoSection).toBe('');
    });

    it('returns fallback todoSection when no TODO header exists', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(
        planPath,
        `# Ketchup Plan

- [ ] Burst 1: Task without TODO header
`,
      );

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(1);
      expect(result.todoSection).toBe('1 unchecked items found');
    });

    it('handles triple-hash headers', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(
        planPath,
        `# Ketchup Plan

### TODO

- [ ] Burst 1: Task

### DONE
`,
      );

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(1);
      expect(result.todoSection).toContain('TODO');
    });
  });

  describe('buildPrompt', () => {
    it('builds prompt with clues and plan info', () => {
      const clues: ClueCollectorResult = {
        clues: [
          {
            timestamp: '2026-01-01T00:00:00Z',
            type: 'pattern',
            source: 'assistant',
            text: 'Would you like to continue?',
            matchedPattern: 'Would you like',
          },
        ],
        lastChats: [{ timestamp: '2026-01-01T00:00:00Z', user: 'Fix the bug', assistant: 'I fixed it' }],
        summary: '1 clue',
        sessionCwd: '/tmp',
        ketchupPlanPaths: [],
        workingDirs: [],
      };

      const result = buildPrompt(clues, '2 incomplete bursts');

      expect(result).toContain('Would you like to continue?');
      expect(result).toContain('Fix the bug');
      expect(result).toContain('2 incomplete bursts');
      expect(result).toContain('CONTINUE');
      expect(result).toContain('STOP');
    });

    it('handles empty clues', () => {
      const clues: ClueCollectorResult = {
        clues: [],
        lastChats: [],
        summary: 'no clues',
        sessionCwd: '/tmp',
        ketchupPlanPaths: [],
        workingDirs: [],
      };

      const result = buildPrompt(clues, '');

      expect(result).toContain('(no clues found)');
      expect(result).toContain('(no chats found)');
    });
  });

  describe('handleStop', () => {
    it('returns allow when mode is off', () => {
      const autoDir = path.join(tempDir, '.claude-auto');
      fs.mkdirSync(autoDir, { recursive: true });
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify({ autoContinue: { mode: 'off' } }));

      const input: StopHookInput = { session_id: 'test-session' };
      const result = handleStop(autoDir, input);

      expect(result).toEqual({ decision: 'allow', reason: 'auto-continue disabled' });
    });

    it('returns allow when stop_hook_active is true', () => {
      const autoDir = path.join(tempDir, '.claude-auto');
      fs.mkdirSync(autoDir, { recursive: true });
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify({ autoContinue: { mode: 'smart' } }));

      const input: StopHookInput = { session_id: 'test-session', stop_hook_active: true };
      const result = handleStop(autoDir, input);

      expect(result).toEqual({ decision: 'allow', reason: 'stop hook already active' });
    });

    it('returns allow with no work remaining when smart mode has no signals', () => {
      const autoDir = path.join(tempDir, '.claude-auto');
      fs.mkdirSync(autoDir, { recursive: true });
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify({ autoContinue: { mode: 'smart' } }));

      const input: StopHookInput = { session_id: 'test-session' };
      const result = handleStop(autoDir, input);

      expect(result).toEqual({ decision: 'allow', reason: 'no work remaining' });
    });

    it('defaults to skipping plan mode via DEFAULT_HOOK_STATE skipModes', () => {
      const autoDir = path.join(tempDir, '.claude-auto');
      fs.mkdirSync(autoDir, { recursive: true });
      fs.writeFileSync(path.join(autoDir, '.claude.hooks.json'), JSON.stringify({ autoContinue: { mode: 'smart' } }));

      const input: StopHookInput = { session_id: 'test-session', permission_mode: 'plan' };
      const result = handleStop(autoDir, input);

      expect(result).toEqual({ decision: 'allow', reason: 'skipping mode: plan' });
    });

    it('returns allow when permission_mode is in skipModes', () => {
      const autoDir = path.join(tempDir, '.claude-auto');
      fs.mkdirSync(autoDir, { recursive: true });
      fs.writeFileSync(
        path.join(autoDir, '.claude.hooks.json'),
        JSON.stringify({ autoContinue: { mode: 'smart', skipModes: ['plan'] } }),
      );

      const input: StopHookInput = { session_id: 'test-session', permission_mode: 'plan' };
      const result = handleStop(autoDir, input);

      expect(result).toEqual({ decision: 'allow', reason: 'skipping mode: plan' });
    });
  });
});
