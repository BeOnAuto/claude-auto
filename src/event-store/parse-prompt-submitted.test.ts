import { describe, expect, it } from 'vitest';

import { parsePromptSubmitted } from './parse-prompt-submitted.js';

describe('parsePromptSubmitted', () => {
  it('translates a user-typed prompt line into a PromptSubmitted event', () => {
    const line = JSON.stringify({
      parentUuid: 'fe5e95b9-38ed-449d-a115-6dc9612e42e3',
      isSidechain: false,
      promptId: 'eb2f3a27-2549-43a4-9d84-8bbb0b985826',
      type: 'user',
      message: {
        role: 'user',
        content: 'it looks like we can clean up legacy way of installing this plugin',
      },
      uuid: '1e5a0a46-542e-486e-82db-bcedb1d48dc9',
      timestamp: '2026-03-24T13:21:17.055Z',
      permissionMode: 'default',
      userType: 'external',
      entrypoint: 'cli',
      cwd: '/Users/sam/Projects/xolvio/ketchup',
      sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
      version: '2.1.81',
      gitBranch: 'main',
    });

    expect(parsePromptSubmitted(line)).toEqual([
      {
        type: 'PromptSubmitted',
        sessionId: '1c62519e-23e0-4da5-b54f-a23c75943f1e',
        prompt: 'it looks like we can clean up legacy way of installing this plugin',
        timestamp: '2026-03-24T13:21:17.055Z',
        source: {
          line,
          uuid: '1e5a0a46-542e-486e-82db-bcedb1d48dc9',
        },
      },
    ]);
  });

  it('translates a queued_command attachment line into a PromptSubmitted event', () => {
    const line = JSON.stringify({
      parentUuid: 'f1420e48-46c6-4248-8988-2283dec54a4e',
      isSidechain: false,
      attachment: {
        type: 'queued_command',
        prompt: 'also - we need auto scroll',
        commandMode: 'prompt',
      },
      type: 'attachment',
      uuid: '5056f069-fbe0-4884-8ba3-618fa1262f11',
      timestamp: '2026-04-24T13:37:46.647Z',
      sessionId: 'd886289b-6710-482e-a5e5-ebbf146318ae',
    });

    expect(parsePromptSubmitted(line)).toEqual([
      {
        type: 'PromptSubmitted',
        sessionId: 'd886289b-6710-482e-a5e5-ebbf146318ae',
        prompt: 'also - we need auto scroll',
        timestamp: '2026-04-24T13:37:46.647Z',
        source: {
          line,
          uuid: '5056f069-fbe0-4884-8ba3-618fa1262f11',
        },
      },
    ]);
  });
});
