import { describe, expect, it } from 'vitest';

import { parseThoughtRecorded } from './parse-thought-recorded.js';

describe('parseThoughtRecorded', () => {
  it('emits a ThoughtRecorded event for a thinking content item in an assistant envelope', () => {
    const line = JSON.stringify({
      parentUuid: 'abc',
      isSidechain: false,
      message: {
        model: 'claude-opus-4-6',
        id: 'msg_xyz',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'thinking', thinking: 'Let me analyze this.', signature: 'EtgDabc123' }],
      },
      type: 'assistant',
      uuid: '0361714b-df10-483d-bb7e-606cbdb9bf97',
      timestamp: '2026-03-24T13:21:22.802Z',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      version: '2.1.81',
      gitBranch: 'main',
      entrypoint: 'cli',
    });

    expect(parseThoughtRecorded(line)).toEqual([
      {
        type: 'ThoughtRecorded',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        thinking: 'Let me analyze this.',
        signature: 'EtgDabc123',
        timestamp: '2026-03-24T13:21:22.802Z',
        source: { line, uuid: '0361714b-df10-483d-bb7e-606cbdb9bf97' },
      },
    ]);
  });
});
