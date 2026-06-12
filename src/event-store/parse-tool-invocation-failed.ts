export interface ToolInvocationFailed {
  type: 'ToolInvocationFailed';
  sessionId: string;
  toolUseId: string;
  error: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface ContentItem {
  type: string;
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

interface Envelope {
  type: string;
  sessionId: string;
  timestamp: string;
  uuid: string;
  message: { content: ContentItem[] };
}

export function parseToolInvocationFailed(line: string): ToolInvocationFailed[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'user') return [];
  if (!Array.isArray(envelope.message.content)) return [];
  const events: ToolInvocationFailed[] = [];
  for (const item of envelope.message.content) {
    if (item.type === 'tool_result' && item.is_error === true) {
      events.push({
        type: 'ToolInvocationFailed',
        sessionId: envelope.sessionId,
        toolUseId: item.tool_use_id,
        error: item.content,
        timestamp: envelope.timestamp,
        source: { line, uuid: envelope.uuid },
      });
    }
  }
  return events;
}
