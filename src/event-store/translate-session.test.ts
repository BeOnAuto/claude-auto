import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { translateSession } from './translate-session.js';

describe('translateSession', () => {
  it('returns parsed events from each line in file order', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ev-'));
    const path = join(dir, 'session.jsonl');
    const sessionStartLine = JSON.stringify({
      type: 'progress',
      data: {
        type: 'hook_progress',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node s.js',
      },
      uuid: 'u1',
      timestamp: 't1',
      sessionId: 's',
      cwd: 'c',
      gitBranch: 'b',
      version: 'v',
      entrypoint: 'e',
    });
    const promptLine = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: 'hello' },
      uuid: 'u2',
      timestamp: 't2',
      sessionId: 's',
    });
    writeFileSync(path, `${sessionStartLine}\n${promptLine}\n`);

    expect(await translateSession(path)).toEqual([
      {
        type: 'SessionStarted',
        sessionId: 's',
        cwd: 'c',
        gitBranch: 'b',
        version: 'v',
        entrypoint: 'e',
        timestamp: 't1',
        source: { line: sessionStartLine, uuid: 'u1' },
      },
      {
        type: 'HookExecuted',
        sessionId: 's',
        hookEvent: 'SessionStart',
        hookName: 'SessionStart:startup',
        command: 'node s.js',
        timestamp: 't1',
        source: { line: sessionStartLine, uuid: 'u1' },
      },
      {
        type: 'PromptSubmitted',
        sessionId: 's',
        prompt: 'hello',
        timestamp: 't2',
        source: { line: promptLine, uuid: 'u2' },
      },
    ]);
  });
});
