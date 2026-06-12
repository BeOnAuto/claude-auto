import type { SQLiteConnection } from '@event-driven-io/emmett-sqlite';

export interface SessionSummary {
  sessionId: string;
  eventCount: number;
  firstTimestamp: string;
  lastTimestamp: string;
  summary: string;
}

interface Row {
  stream_id: string;
  event_count: number;
  first_timestamp: string;
  last_timestamp: string;
  summary: string;
}

export async function listSessions(connection: SQLiteConnection): Promise<SessionSummary[]> {
  const rows = await connection.query<Row>(
    `SELECT stream_id,
            COUNT(*) AS event_count,
            MIN(json_extract(message_data, '$.timestamp')) AS first_timestamp,
            MAX(json_extract(message_data, '$.timestamp')) AS last_timestamp,
            COALESCE(
              (SELECT json_extract(first_prompt.message_data, '$.prompt')
               FROM emt_messages AS first_prompt
               WHERE first_prompt.stream_id = emt_messages.stream_id
                 AND first_prompt.message_type = 'PromptSubmitted'
                 AND first_prompt.is_archived = 0
               ORDER BY json_extract(first_prompt.message_data, '$.timestamp') ASC
               LIMIT 1),
              ''
            ) AS summary
     FROM emt_messages
     WHERE stream_id LIKE 'session-%' AND is_archived = 0
     GROUP BY stream_id
     ORDER BY last_timestamp DESC`,
  );

  return rows.map((row) => ({
    sessionId: row.stream_id.slice('session-'.length),
    eventCount: row.event_count,
    firstTimestamp: row.first_timestamp,
    lastTimestamp: row.last_timestamp,
    summary: row.summary,
  }));
}
