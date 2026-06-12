import type { Event } from '@event-driven-io/emmett';
import type { SQLiteEventStore } from '@event-driven-io/emmett-sqlite';

import { type SessionEvent, translateSession } from './translate-session.js';

type StoredSessionEvent = SessionEvent extends { type: infer Type extends string }
  ? Event<Type, SessionEvent & Record<string, unknown>>
  : never;

export async function ingestSession(jsonlPath: string, store: SQLiteEventStore): Promise<SessionEvent[]> {
  const events = await translateSession(jsonlPath);
  if (events.length === 0) return [];
  const streamName = `session-${events[0].sessionId}`;

  const existing = await store.readStream<StoredSessionEvent>(streamName);
  const knownUuids = new Set(existing.events.map((event) => event.data.source.uuid));
  const newEvents = events.filter((event) => !knownUuids.has(event.source.uuid));
  if (newEvents.length === 0) return [];

  const emmettEvents: Array<{ type: string; data: Record<string, unknown> }> = newEvents.map((event) => ({
    type: event.type,
    data: JSON.parse(JSON.stringify(event)),
  }));
  await store.appendToStream(streamName, emmettEvents);
  return newEvents;
}
