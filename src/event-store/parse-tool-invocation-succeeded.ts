export interface ToolInvocationSucceeded {
  type: 'ToolInvocationSucceeded';
  sessionId: string;
  toolUseId: string;
  content: string;
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

export function parseToolInvocationSucceeded(line: string): ToolInvocationSucceeded[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'user' || !Array.isArray(envelope.message?.content)) {
    return [];
  }
  const events: ToolInvocationSucceeded[] = [];
  for (const item of envelope.message.content) {
    if (item.type === 'tool_result' && item.is_error !== true) {
      events.push({
        type: 'ToolInvocationSucceeded',
        sessionId: envelope.sessionId,
        toolUseId: item.tool_use_id,
        content: item.content,
        timestamp: envelope.timestamp,
        source: { line, uuid: envelope.uuid },
      });
    }
  }
  return events;
}
