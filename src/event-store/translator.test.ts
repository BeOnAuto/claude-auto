import { describe, expect, it, test } from 'vitest';

import { parseSessionStarted } from './translator.js';

describe('parseSessionStarted', () => {
  it('translates a SessionStart hook_progress line into a SessionStarted event', () => {
    const line = JSON.stringify({
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node session-start.js',
      },
      uuid: 'd18b3b7d-cf88-42e3-9cd4-8c23220c3b3a',
      timestamp: '2026-03-24T13:04:50.596Z',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      gitBranch: 'main',
      version: '2.1.81',
      entrypoint: 'cli',
    });

    expect(parseSessionStarted(line)).toEqual([
      {
        type: 'SessionStarted',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        cwd: '/Users/sam/Projects/xolvio/ketchup',
        gitBranch: 'main',
        version: '2.1.81',
        entrypoint: 'cli',
        timestamp: '2026-03-24T13:04:50.596Z',
        source: {
          line,
          uuid: 'd18b3b7d-cf88-42e3-9cd4-8c23220c3b3a',
        },
      },
    ]);
  });

  test.each([
    [
      'non-progress envelope',
      {
        type: 'user',
        sessionId: 's',
        cwd: 'c',
        gitBranch: 'b',
        version: 'v',
        entrypoint: 'e',
        timestamp: 't',
        uuid: 'u',
      },
    ],
    [
      'non-hook_progress data',
      {
        type: 'progress',
        data: { type: 'agent_progress' },
        sessionId: 's',
        cwd: 'c',
        gitBranch: 'b',
        version: 'v',
        entrypoint: 'e',
        timestamp: 't',
        uuid: 'u',
      },
    ],
    [
      'non-SessionStart hookEvent',
      {
        type: 'progress',
        data: { type: 'hook_progress', hookEvent: 'Stop', hookName: 'Stop' },
        sessionId: 's',
        cwd: 'c',
        gitBranch: 'b',
        version: 'v',
        entrypoint: 'e',
        timestamp: 't',
        uuid: 'u',
      },
    ],
    [
      'non-startup hookName',
      {
        type: 'progress',
        data: { type: 'hook_progress', hookEvent: 'SessionStart', hookName: 'SessionStart:resume' },
        sessionId: 's',
        cwd: 'c',
        gitBranch: 'b',
        version: 'v',
        entrypoint: 'e',
        timestamp: 't',
        uuid: 'u',
      },
    ],
  ])('returns [] for %s', (_label, envelope) => {
    expect(parseSessionStarted(JSON.stringify(envelope))).toEqual([]);
  });
});
