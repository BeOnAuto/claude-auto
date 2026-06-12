export interface HookExecuted {
  type: 'HookExecuted';
  sessionId: string;
  hookEvent: string;
  hookName: string;
  command: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  data: { type: string; hookEvent: string; hookName: string; command: string };
  sessionId: string;
  timestamp: string;
  uuid: string;
}

export function parseHookExecuted(line: string): HookExecuted[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'progress' || envelope.data.type !== 'hook_progress') {
    return [];
  }
  return [
    {
      type: 'HookExecuted',
      sessionId: envelope.sessionId,
      hookEvent: envelope.data.hookEvent,
      hookName: envelope.data.hookName,
      command: envelope.data.command,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}
