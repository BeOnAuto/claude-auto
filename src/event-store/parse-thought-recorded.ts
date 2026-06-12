export interface ThoughtRecorded {
  type: 'ThoughtRecorded';
  sessionId: string;
  thinking: string;
  signature: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface ThinkingItem {
  type: 'thinking';
  thinking: string;
  signature: string;
}

interface OtherItem {
  type: 'text' | 'tool_use' | 'tool_result';
}

type ContentItem = ThinkingItem | OtherItem;

interface Envelope {
  type: string;
  sessionId: string;
  uuid: string;
  timestamp: string;
  message: { content: ContentItem[] };
}

export function parseThoughtRecorded(line: string): ThoughtRecorded[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'assistant') {
    return [];
  }
  const events: ThoughtRecorded[] = [];
  for (const item of envelope.message.content) {
    if (item.type === 'thinking') {
      events.push({
        type: 'ThoughtRecorded',
        sessionId: envelope.sessionId,
        thinking: item.thinking,
        signature: item.signature,
        timestamp: envelope.timestamp,
        source: { line, uuid: envelope.uuid },
      });
    }
  }
  return events;
}
