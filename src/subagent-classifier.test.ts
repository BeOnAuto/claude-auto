import { describe, expect, it } from 'vitest';

import {
  classifySubagent,
  extractTaskDescription,
  type SubagentType,
} from './subagent-classifier.js';

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

  describe('extractTaskDescription', () => {
    it('extracts description from Task tool invocation', () => {
      const transcript = [
        '<invoke name="Task">',
        '<parameter name="description">Search for auth implementation</parameter>',
        '<parameter name="prompt">Find all files</parameter>',
        '</invoke>',
      ].join('\n');

      expect(extractTaskDescription(transcript)).toBe('Search for auth implementation');
    });

    it('returns undefined when no Task invocation found', () => {
      const transcript = [
        '<invoke name="Read">',
        '<parameter name="file_path">/some/file.ts</parameter>',
        '</invoke>',
      ].join('\n');

      expect(extractTaskDescription(transcript)).toBeUndefined();
    });

    it('returns undefined for empty transcript', () => {
      expect(extractTaskDescription('')).toBeUndefined();
    });

    it('extracts first Task description when multiple present', () => {
      const transcript = [
        '<invoke name="Task">',
        '<parameter name="description">First task</parameter>',
        '</invoke>',
        '<invoke name="Task">',
        '<parameter name="description">Second task</parameter>',
        '</invoke>',
      ].join('\n');

      expect(extractTaskDescription(transcript)).toBe('First task');
    });
  });
});
