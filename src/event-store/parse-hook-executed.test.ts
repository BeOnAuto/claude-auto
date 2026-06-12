import { describe, expect, it } from 'vitest';

import { parseHookExecuted } from './parse-hook-executed.js';

describe('parseHookExecuted', () => {
  it('translates a hook_progress line into a HookExecuted event', () => {
    const line = JSON.stringify({
      parentUuid: null,
      isSidechain: false,
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node /Users/sam/Projects/xolvio/ketchup/.ketchup/scripts/session-start.js',
      },
      parentToolUseID: '36c8f04b-8af7-41cf-96d8-da3eba7e2485',
      toolUseID: '36c8f04b-8af7-41cf-96d8-da3eba7e2485',
      timestamp: '2026-03-24T13:04:50.596Z',
      uuid: 'd18b3b7d-cf88-42e3-9cd4-8c23220c3b3a',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseHookExecuted(line)).toEqual([
      {
        type: 'HookExecuted',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node /Users/sam/Projects/xolvio/ketchup/.ketchup/scripts/session-start.js',
        timestamp: '2026-03-24T13:04:50.596Z',
        source: {
          line,
          uuid: 'd18b3b7d-cf88-42e3-9cd4-8c23220c3b3a',
        },
      },
    ]);
  });
});
