import { describe, expect, it } from 'vitest';
import { parseToolInvocationSucceeded } from './parse-tool-invocation-succeeded';

describe('parseToolInvocationSucceeded', () => {
  it('emits one ToolInvocationSucceeded event per tool_result item without is_error in a user envelope', () => {
    const line = JSON.stringify({
      parentUuid: '1cdcfce5-75d3-43be-ba06-151763d936e3',
      isSidechain: false,
      promptId: 'eb2f3a27-2549-43a4-9d84-8bbb0b985826',
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            tool_use_id: 'toolu_01QrvX3Q9rcMNn9ECuYq44ea',
            type: 'tool_result',
            content: 'File content here',
          },
        ],
      },
      uuid: 'ab5412ed-7a32-41ef-8dc5-b134d42ce4e5',
      timestamp: '2026-03-24T13:21:33.018Z',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseToolInvocationSucceeded(line)).toEqual([
      {
        type: 'ToolInvocationSucceeded',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        toolUseId: 'toolu_01QrvX3Q9rcMNn9ECuYq44ea',
        content: 'File content here',
        timestamp: '2026-03-24T13:21:33.018Z',
        source: { line, uuid: 'ab5412ed-7a32-41ef-8dc5-b134d42ce4e5' },
      },
    ]);
  });
});
