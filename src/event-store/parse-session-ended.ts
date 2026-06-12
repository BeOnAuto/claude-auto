export interface SessionEnded {
  type: 'SessionEnded';
  sessionId: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  data: { type: string; hookEvent: string };
  sessionId: string;
  timestamp: string;
  uuid: string;
}

export function parseSessionEnded(line: string): SessionEnded[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'progress' || envelope.data.type !== 'hook_progress' || envelope.data.hookEvent !== 'Stop') {
    return [];
  }
  return [
    {
      type: 'SessionEnded',
      sessionId: envelope.sessionId,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}
