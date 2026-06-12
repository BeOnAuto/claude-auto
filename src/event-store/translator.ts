export interface SessionStarted {
  type: 'SessionStarted';
  sessionId: string;
  cwd: string;
  gitBranch: string;
  version: string;
  entrypoint: string;
  timestamp: string;
  source: { line: string; uuid: string };
}

interface Envelope {
  type?: string;
  data?: { type?: string; hookEvent?: string; hookName?: string };
  sessionId: string;
  cwd: string;
  gitBranch: string;
  version: string;
  entrypoint: string;
  timestamp: string;
  uuid: string;
}

export function parseSessionStarted(line: string): SessionStarted[] {
  const envelope: Envelope = JSON.parse(line);
  const isSessionStart =
    envelope.type === 'progress' &&
    envelope.data?.type === 'hook_progress' &&
    envelope.data?.hookEvent === 'SessionStart' &&
    envelope.data?.hookName === 'SessionStart:startup';
  if (!isSessionStart) return [];
  return [
    {
      type: 'SessionStarted',
      sessionId: envelope.sessionId,
      cwd: envelope.cwd,
      gitBranch: envelope.gitBranch,
      version: envelope.version,
      entrypoint: envelope.entrypoint,
      timestamp: envelope.timestamp,
      source: { line, uuid: envelope.uuid },
    },
  ];
}
