import { useEffect, useState } from 'react';

import { cn } from './lib/utils';

export interface SessionSummary {
  sessionId: string;
  eventCount: number;
  firstTimestamp: string;
  lastTimestamp: string;
  summary: string;
}

export function SessionPicker({
  onSelect,
  selectedId,
}: {
  onSelect: (session: SessionSummary) => void;
  selectedId?: string;
}) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((response) => response.json())
      .then((body: { sessions: SessionSummary[] }) => setSessions(body.sessions));
  }, []);

  return (
    <ul className="space-y-2">
      {sessions.map((session) => (
        <li key={session.sessionId}>
          <button
            type="button"
            onClick={() => onSelect(session)}
            className={cn(
              'w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:bg-slate-50 dark:border-ketchup-divider dark:bg-ketchup-surface dark:shadow-none dark:hover:bg-ketchup-bg-soft',
              session.sessionId === selectedId && 'ring-2 ring-inset ring-blue-500 dark:ring-ketchup-brand',
            )}
          >
            <div data-testid="session-label" className="line-clamp-2 font-medium text-slate-800 dark:text-ketchup-text">
              {session.summary || `${session.sessionId.slice(0, 8)}…`}
            </div>
            <div data-testid="session-meta" className="mt-1 flex gap-2 text-xs text-slate-500 dark:text-ketchup-text-3">
              <span>{session.eventCount} events</span>
              <span>·</span>
              <span>{new Date(session.lastTimestamp).toLocaleString()}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
