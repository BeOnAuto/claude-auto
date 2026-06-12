import { describe, expect, it } from 'vitest';

import { parseFileModified } from './parse-file-modified.js';

describe('parseFileModified', () => {
  it('translates a user tool_result line with create operation into one FileModified event', () => {
    const line = JSON.stringify({
      parentUuid: '26134289-e7bc-4c3b-a550-58a95651ad4f',
      isSidechain: false,
      promptId: '6f95de95-3d7f-492a-8237-fa78e648e59b',
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            tool_use_id: 'toolu_015RuxUYBsBeMpWv3n7cqbtT',
            type: 'tool_result',
            content: 'File created successfully at: /Users/sam/Projects/xolvio/ketchup/src/plan-progress.test.ts',
          },
        ],
      },
      uuid: 'c76a78bb-7a00-4d18-b465-b357a6477d34',
      timestamp: '2026-03-24T16:29:17.160Z',
      toolUseResult: {
        type: 'create',
        filePath: '/Users/sam/Projects/xolvio/ketchup/src/plan-progress.test.ts',
        content: '...',
        structuredPatch: [],
        originalFile: null,
      },
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'claude-plugin-cleanup',
      entrypoint: 'cli',
    });

    expect(parseFileModified(line)).toEqual([
      {
        type: 'FileModified',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        filePath: '/Users/sam/Projects/xolvio/ketchup/src/plan-progress.test.ts',
        operation: 'create',
        timestamp: '2026-03-24T16:29:17.160Z',
        source: {
          line,
          uuid: 'c76a78bb-7a00-4d18-b465-b357a6477d34',
        },
      },
    ]);
  });
});
