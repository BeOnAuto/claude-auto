import { describe, expect, it } from 'vitest';

import { parseAssistantResponded } from './parse-assistant-responded.js';

describe('parseAssistantResponded', () => {
  it('translates an assistant line with a single text content item into one AssistantResponded event', () => {
    const line = JSON.stringify({
      parentUuid: 'abc',
      isSidechain: false,
      message: {
        model: 'claude-opus-4-6',
        id: 'msg_xyz',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Here is my response.' }],
        stop_reason: null,
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

    expect(parseAssistantResponded(line)).toEqual([
      {
        type: 'AssistantResponded',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        text: 'Here is my response.',
        timestamp: '2026-03-24T13:21:22.802Z',
        source: {
          line,
          uuid: '0361714b-df10-483d-bb7e-606cbdb9bf97',
        },
      },
    ]);
  });
});
