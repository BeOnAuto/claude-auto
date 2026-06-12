export interface FileModified {
  type: 'FileModified';
  sessionId: string;
  filePath: string;
  operation: 'create' | 'update';
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  sessionId: string;
  timestamp: string;
  uuid: string;
  toolUseResult?: { type: string; filePath: string };
}

export function parseFileModified(line: string): FileModified[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'user') return [];
  const result = envelope.toolUseResult;
  if (!result || (result.type !== 'create' && result.type !== 'update')) return [];
  return [
    {
      type: 'FileModified',
      sessionId: envelope.sessionId,
      filePath: result.filePath,
      operation: result.type,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}
