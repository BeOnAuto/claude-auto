import type { Event } from '@event-driven-io/emmett';
import type { SQLiteEventStore } from '@event-driven-io/emmett-sqlite';

import type { SessionEvent } from './translate-session.js';

type StoredSessionEvent = SessionEvent extends { type: infer Type extends string }
  ? Event<Type, SessionEvent & Record<string, unknown>>
  : never;

export async function readSessionEvents(store: SQLiteEventStore, sessionId: string): Promise<SessionEvent[]> {
  const result = await store.readStream<StoredSessionEvent>(`session-${sessionId}`);
  return result.events.map((event) => event.data);
}
