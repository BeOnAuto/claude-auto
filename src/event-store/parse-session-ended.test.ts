import { describe, expect, it } from 'vitest';

import { parseSessionEnded } from './parse-session-ended.js';

describe('parseSessionEnded', () => {
  it('translates a Stop hook line into a SessionEnded event', () => {
    const line = JSON.stringify({
      parentUuid: '693e2d96-2369-46e5-9e25-adb8385524ef',
      isSidechain: false,
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'Stop',
        hookName: 'Stop',
        command: 'node /Users/sam/Projects/xolvio/ketchup/.ketchup/scripts/session-start.js',
      },
      parentToolUseID: '4ee71898-b062-4fd4-b8a6-46b995bf92e9',
      toolUseID: '4ee71898-b062-4fd4-b8a6-46b995bf92e9',
      timestamp: '2026-03-24T13:45:42.851Z',
      uuid: 'f782259f-85ae-445b-bc79-26ca3db3ea3d',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseSessionEnded(line)).toEqual([
      {
        type: 'SessionEnded',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        timestamp: '2026-03-24T13:45:42.851Z',
        source: {
          line,
          uuid: 'f782259f-85ae-445b-bc79-26ca3db3ea3d',
        },
      },
    ]);
  });
});
