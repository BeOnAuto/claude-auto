import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CONTINUE_PATTERNS, collectClues } from './clue-collector.js';

describe('clue-collector', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-clue-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('collectClues', () => {
    it('returns empty result when transcript does not exist', () => {
      const result = collectClues('/nonexistent/path.jsonl');

      expect(result.clues).toEqual([]);
      expect(result.lastChats).toEqual([]);
      expect(result.summary).toContain('Error reading transcript');
    });

    it('extracts pattern clues from assistant messages', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Would you like me to continue with the next step?' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.clues).toHaveLength(1);
      expect(result.clues[0].type).toBe('pattern');
      expect(result.clues[0].matchedPattern).toBe('Would you like me to continue');
    });

    it('extracts ketchup mentions from assistant messages', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Following the Ketchup technique...' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.clues.some((c) => c.type === 'ketchup')).toBe(true);
    });

    it('extracts plan mentions from assistant messages', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'The plan is to implement feature X' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.clues.some((c) => c.type === 'plan')).toBe(true);
    });

    it('tracks ketchup-plan.md paths from tool calls', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/project/ketchup-plan.md' } }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.ketchupPlanPaths).toContain('/project/ketchup-plan.md');
    });

    it('tracks ketchup-plan.md paths from text content', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'I will update /project/ketchup-plan.md with the changes' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.ketchupPlanPaths).toContain('/project/ketchup-plan.md');
    });

    it('tracks working directories from file paths', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/project/src/file.ts' } }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.workingDirs).toContain('/project/src');
    });

    it('tracks session cwd from entries', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        { type: 'system', cwd: '/custom/working/dir' },
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Hello' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.sessionCwd).toBe('/custom/working/dir');
    });

    it('collects chat exchanges between user and assistant', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'user',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Help me fix this bug' }] },
        },
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:01Z',
          message: { content: [{ type: 'text', text: 'I can help with that' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.lastChats).toHaveLength(1);
      expect(result.lastChats[0].user).toBe('Help me fix this bug');
      expect(result.lastChats[0].assistant).toBe('I can help with that');
    });

    it('limits clues and chats to max counts', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries: unknown[] = [];
      for (let i = 0; i < 20; i++) {
        entries.push({
          type: 'user',
          timestamp: `2026-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
          message: { content: [{ type: 'text', text: `Question ${i}` }] },
        });
        entries.push({
          type: 'assistant',
          timestamp: `2026-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
          message: { content: [{ type: 'text', text: `Would you like me to continue? Reply ${i}` }] },
        });
      }
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.lastChats.length).toBeLessThanOrEqual(5);
      expect(result.clues.length).toBeLessThanOrEqual(30);
    });

    it('truncates long messages in clues', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const longText = 'ketchup '.repeat(100);
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: longText }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.clues[0].text.length).toBeLessThan(longText.length);
      expect(result.clues[0].text.endsWith('...')).toBe(true);
    });

    it('skips invalid JSON lines', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const content =
        'invalid json\n' +
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Valid entry with ketchup' }] },
        });
      fs.writeFileSync(transcript, content);

      const result = collectClues(transcript);

      expect(result.clues.some((c) => c.type === 'ketchup')).toBe(true);
    });

    it('handles text blocks without text property', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text' }, { type: 'text', text: 'ketchup' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.clues.some((c) => c.type === 'ketchup')).toBe(true);
    });

    it('extracts cd commands from Bash tool calls', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'cd /some/directory && ls' } }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.workingDirs).toContain('/some/directory');
    });

    it('builds summary with counts', () => {
      const transcript = path.join(tempDir, 'session.jsonl');
      const entries = [
        {
          type: 'assistant',
          timestamp: '2026-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'Following ketchup plan' }] },
        },
      ];
      fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));

      const result = collectClues(transcript);

      expect(result.summary).toContain('Ketchup clues: 1');
      expect(result.summary).toContain('Plan clues: 1');
    });
  });

  describe('CONTINUE_PATTERNS', () => {
    it('exports patterns array', () => {
      expect(Array.isArray(CONTINUE_PATTERNS)).toBe(true);
      expect(CONTINUE_PATTERNS.length).toBeGreaterThan(0);
    });

    it('matches continuation phrases', () => {
      const testPhrases = [
        'Would you like me to continue?',
        'Shall I proceed with the next step?',
        'Ready to proceed',
        'Continue with the remaining bursts',
        'Next burst is...',
      ];

      for (const phrase of testPhrases) {
        const matched = CONTINUE_PATTERNS.some((p) => p.test(phrase));
        expect(matched).toBe(true);
      }
    });
  });
});
