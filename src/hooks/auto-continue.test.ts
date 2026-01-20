import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getIncompleteBursts, buildPrompt } from './auto-continue.js';
import type { ClueCollectorResult } from '../clue-collector.js';

describe('auto-continue hook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-autocontinue-'));
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
      fs.writeFileSync(planPath, `# Ketchup Plan

## TODO

- [ ] Burst 1: First task
- [ ] Burst 2: Second task

## DONE

- [x] Burst 0: Setup
`);

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(2);
      expect(result.path).toBe(planPath);
      expect(result.todoSection).toContain('Burst 1');
    });

    it('returns zero count when all items checked', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(planPath, `# Ketchup Plan

## TODO

## DONE

- [x] Burst 1: Complete
`);

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(0);
      expect(result.todoSection).toBe('');
    });

    it('handles triple-hash headers', () => {
      const planPath = path.join(tempDir, 'ketchup-plan.md');
      fs.writeFileSync(planPath, `# Ketchup Plan

### TODO

- [ ] Burst 1: Task

### DONE
`);

      const result = getIncompleteBursts(planPath);

      expect(result.count).toBe(1);
      expect(result.todoSection).toContain('TODO');
    });
  });

  describe('buildPrompt', () => {
    it('builds prompt with clues and ketchup info', () => {
      const clues: ClueCollectorResult = {
        clues: [
          { timestamp: '2026-01-01T00:00:00Z', type: 'pattern', text: 'Would you like to continue?', matchedPattern: 'Would you like' },
        ],
        lastChats: [
          { timestamp: '2026-01-01T00:00:00Z', user: 'Fix the bug', assistant: 'I fixed it' },
        ],
        summary: '1 clue',
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
        ketchupPlanPaths: [],
        workingDirs: [],
      };

      const result = buildPrompt(clues, '');

      expect(result).toContain('(no clues found)');
      expect(result).toContain('(no chats found)');
    });
  });
});
