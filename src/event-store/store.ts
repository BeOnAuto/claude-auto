import { getSQLiteEventStore, type SQLiteEventStore } from '@event-driven-io/emmett-sqlite';

export async function createEventStore(dbPath: string): Promise<SQLiteEventStore> {
  const store = getSQLiteEventStore({ fileName: dbPath });
  await store.schema.migrate();
  return store;
}
