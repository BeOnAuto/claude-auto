import { describe, expect, it } from 'vitest';

import { parseToolInvocationFailed } from './parse-tool-invocation-failed.js';

describe('parseToolInvocationFailed', () => {
  it('translates a user tool_result error item into one ToolInvocationFailed event', () => {
    const line = JSON.stringify({
      parentUuid: '2e2a1520-0a53-4bf8-9bda-643a413ebc5e',
      isSidechain: false,
      promptId: 'eb2f3a27-2549-43a4-9d84-8bbb0b985826',
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            content: '<tool_use_error>File has not been read yet. Read it first before writing to it.</tool_use_error>',
            is_error: true,
            tool_use_id: 'toolu_01Hq4VYC5KR889sMqFt3wHU8',
          },
        ],
      },
      uuid: 'c9e8ac4b-2d0a-4d15-aef1-19d5f9f989a6',
      timestamp: '2026-03-24T13:26:07.733Z',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseToolInvocationFailed(line)).toEqual([
      {
        type: 'ToolInvocationFailed',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        toolUseId: 'toolu_01Hq4VYC5KR889sMqFt3wHU8',
        error: '<tool_use_error>File has not been read yet. Read it first before writing to it.</tool_use_error>',
        timestamp: '2026-03-24T13:26:07.733Z',
        source: {
          line,
          uuid: 'c9e8ac4b-2d0a-4d15-aef1-19d5f9f989a6',
        },
      },
    ]);
  });
});
