import { describe, expect, it } from 'vitest';
import { parseHookInput } from './hook-input.js';

describe('hook-input', () => {
  it('parses JSON string to HookInput object', () => {
    const json = JSON.stringify({
      session_id: 'abc-123',
      cwd: '/some/path',
      hook_event_name: 'SessionStart',
    });

    const result = parseHookInput(json);

    expect(result).toEqual({
      session_id: 'abc-123',
      cwd: '/some/path',
      hook_event_name: 'SessionStart',
    });
  });

  it('parses agent_type field when present', () => {
    const json = JSON.stringify({
      session_id: 'abc-123',
      hook_event_name: 'SessionStart',
      agent_type: 'validator',
    });

    const result = parseHookInput(json);

    expect(result).toEqual({
      session_id: 'abc-123',
      hook_event_name: 'SessionStart',
      agent_type: 'validator',
    });
  });
});
