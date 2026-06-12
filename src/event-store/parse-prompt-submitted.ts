export interface PromptSubmitted {
  type: 'PromptSubmitted';
  sessionId: string;
  prompt: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type: string;
  sessionId: string;
  timestamp: string;
  uuid: string;
  message?: { content: string | unknown[] };
  attachment?: { type: string; prompt?: string };
}

export function parsePromptSubmitted(line: string): PromptSubmitted[] {
  const envelope: Envelope = JSON.parse(line);
  const prompt = extractPrompt(envelope);
  if (prompt === null) return [];
  return [
    {
      type: 'PromptSubmitted',
      sessionId: envelope.sessionId,
      prompt,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}

function extractPrompt(envelope: Envelope): string | null {
  if (envelope.type === 'user' && typeof envelope.message?.content === 'string') {
    return envelope.message.content;
  }
  if (envelope.type === 'attachment' && envelope.attachment?.type === 'queued_command' && envelope.attachment.prompt) {
    return envelope.attachment.prompt;
  }
  return null;
}
