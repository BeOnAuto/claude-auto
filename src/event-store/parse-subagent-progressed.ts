export interface SubagentProgressed {
  type: 'SubagentProgressed';
  sessionId: string;
  parentToolUseId: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  data: { type: string };
  sessionId: string;
  parentToolUseID: string;
  timestamp: string;
  uuid: string;
}

export function parseSubagentProgressed(line: string): SubagentProgressed[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'progress' || envelope.data.type !== 'agent_progress') {
    return [];
  }
  return [
    {
      type: 'SubagentProgressed',
      sessionId: envelope.sessionId,
      parentToolUseId: envelope.parentToolUseID,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}
