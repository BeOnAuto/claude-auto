export interface ToolInvoked {
  type: 'ToolInvoked';
  sessionId: string;
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface ContentItem {
  type: string;
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface Envelope {
  type: string;
  sessionId: string;
  timestamp: string;
  uuid: string;
  message: { content: ContentItem[] };
}

export function parseToolInvoked(line: string): ToolInvoked[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'assistant') {
    return [];
  }
  const events: ToolInvoked[] = [];
  for (const item of envelope.message.content) {
    if (item.type === 'tool_use') {
      events.push({
        type: 'ToolInvoked',
        sessionId: envelope.sessionId,
        toolUseId: item.id,
        toolName: item.name,
        input: item.input,
        timestamp: envelope.timestamp,
        source: { line, uuid: envelope.uuid },
      });
    }
  }
  return events;
}
