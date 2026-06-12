import { describe, expect, it } from 'vitest';
import { parseToolInvoked } from './parse-tool-invoked';

describe('parseToolInvoked', () => {
  it('emits one ToolInvoked event per tool_use content item in an assistant envelope', () => {
    const line = JSON.stringify({
      parentUuid: 'abc',
      isSidechain: false,
      message: {
        model: 'claude-opus-4-6',
        id: 'msg_xyz',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01UmY8LgKDX8PMnrosW8Gmxm',
            name: 'Read',
            input: { file_path: '/tmp/x.ts' },
          },
        ],
      },
      type: 'assistant',
      uuid: '2e0e6a50-fcba-4f05-8f39-e662ffac7ddd',
      timestamp: '2026-03-24T13:21:30.100Z',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseToolInvoked(line)).toEqual([
      {
        type: 'ToolInvoked',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        toolUseId: 'toolu_01UmY8LgKDX8PMnrosW8Gmxm',
        toolName: 'Read',
        input: { file_path: '/tmp/x.ts' },
        timestamp: '2026-03-24T13:21:30.100Z',
        source: { line, uuid: '2e0e6a50-fcba-4f05-8f39-e662ffac7ddd' },
      },
    ]);
  });
});
