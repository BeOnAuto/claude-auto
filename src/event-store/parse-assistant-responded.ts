export interface AssistantResponded {
  type: 'AssistantResponded';
  sessionId: string;
  text: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  sessionId: string;
  timestamp: string;
  uuid: string;
  message: { content: Array<{ type: string; text: string }> };
}

export function parseAssistantResponded(line: string): AssistantResponded[] {
  const envelope: Envelope = JSON.parse(line);
  if (envelope.type !== 'assistant') return [];
  return envelope.message.content
    .filter((item) => item.type === 'text')
    .map((item) => ({
      type: 'AssistantResponded',
      sessionId: envelope.sessionId,
      text: item.text,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    }));
}
