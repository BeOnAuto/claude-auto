import { describe, expect, it } from 'vitest';

import { classifySubagent, type SubagentType } from './subagent-classifier.js';

describe('subagent-classifier', () => {
  describe('classifySubagent', () => {
    it('classifies explore patterns', () => {
      const exploreDescriptions = [
        'Search for files matching pattern',
        'Find the implementation of this function',
        'Understand how the auth system works',
        'Investigate the error',
        'Analyze the codebase structure',
        'Look for usages of this API',
        'Research existing patterns',
      ];

      for (const desc of exploreDescriptions) {
        expect(classifySubagent(desc)).toBe('explore' as SubagentType);
      }
    });

    it('classifies work patterns', () => {
      const workDescriptions = [
        'Implement the new feature',
        'Create a user registration form',
        'Write tests for the login component',
        'Fix the bug in the parser',
        'Refactor the database layer',
        'Update the configuration',
        'Add error handling',
        'Build the API endpoint',
      ];

      for (const desc of workDescriptions) {
        expect(classifySubagent(desc)).toBe('work' as SubagentType);
      }
    });

    it('returns unknown for ambiguous descriptions', () => {
      const ambiguousDescriptions = [
        'Process the request',
        'Handle the response',
        'Do something with the data',
      ];

      for (const desc of ambiguousDescriptions) {
        expect(classifySubagent(desc)).toBe('unknown' as SubagentType);
      }
    });

    it('is case insensitive', () => {
      expect(classifySubagent('SEARCH for files')).toBe('explore');
      expect(classifySubagent('IMPLEMENT feature')).toBe('work');
    });

    it('returns unknown for empty description', () => {
      expect(classifySubagent('')).toBe('unknown');
    });
  });
});
