import { describe, expect, it } from 'vitest';

import { parseSubagentProgressed } from './parse-subagent-progressed.js';

describe('parseSubagentProgressed', () => {
  it('translates an agent_progress progress line into a SubagentProgressed event', () => {
    const line = JSON.stringify({
      parentUuid: '2e0e6a50-fcba-4f05-8f39-e662ffac7ddd',
      isSidechain: false,
      type: 'progress',
      data: {
        type: 'agent_progress',
        prompt: 'Explore this codebase',
        message: {
          type: 'user',
          uuid: '486bdcbe-b01a-4421-8c11-d919d90d7671',
          timestamp: '2026-03-24T13:21:28.963Z',
        },
      },
      parentToolUseID: 'toolu_01UmY8LgKDX8PMnrosW8Gmxm',
      toolUseID: 'toolu_01UmY8LgKDX8PMnrosW8Gmxm',
      timestamp: '2026-03-24T13:21:29.000Z',
      uuid: 'abc-subagent-uuid',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseSubagentProgressed(line)).toEqual([
      {
        type: 'SubagentProgressed',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        parentToolUseId: 'toolu_01UmY8LgKDX8PMnrosW8Gmxm',
        timestamp: '2026-03-24T13:21:29.000Z',
        source: {
          line,
          uuid: 'abc-subagent-uuid',
        },
      },
    ]);
  });
});
