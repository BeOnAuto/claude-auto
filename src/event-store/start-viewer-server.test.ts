import { describe, expect, it } from 'vitest';

import { startViewerServer } from './start-viewer-server.js';
import { createViewerApp } from './viewer-server.js';

describe('startViewerServer', () => {
  it('binds the Express app on 127.0.0.1 and serves the routes over HTTP', async () => {
    const summaries = [{ sessionId: 'abc', eventCount: 1, firstTimestamp: 't', lastTimestamp: 't', summary: 'hi' }];
    const app = createViewerApp({
      listSessions: async () => summaries,
      readSessionEvents: async () => [],
    });

    const server = await startViewerServer(app, 0);
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions`);
    const body = await response.json();
    await new Promise<void>((resolve) => server.close(() => resolve()));

    expect({ status: response.status, body }).toEqual({
      status: 200,
      body: { sessions: summaries },
    });
  });
});
