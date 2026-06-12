import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import express from 'express';
import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createEventWebSocket } from './event-websocket.js';
import type { SessionEvent } from './translate-session.js';

describe('createEventWebSocket', () => {
  it('sends the initial event snapshot for the requested session on connect', async () => {
    const app = express();
    const httpServer = createServer(app);
    const events: SessionEvent[] = [
      {
        type: 'SessionStarted',
        sessionId: 'abc',
        cwd: '/w',
        gitBranch: 'main',
        version: '1',
        entrypoint: 'cli',
        timestamp: '2026-04-20T10:00:00Z',
        source: { line: '{}', uuid: 'u1' },
      },
    ];
    let requestedId = '';
    createEventWebSocket(httpServer, {
      readSessionEvents: async (id) => {
        requestedId = id;
        return events;
      },
    });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const { port } = httpServer.address() as AddressInfo;

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/sessions/abc/events`);
    const message = await new Promise<string>((resolve) => {
      ws.once('message', (data) => resolve(data.toString()));
    });
    ws.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    expect({ requestedId, payload: JSON.parse(message) }).toEqual({
      requestedId: 'abc',
      payload: { events },
    });
  });

  it('broadcasts published events only to clients subscribed to the matching session', async () => {
    const app = express();
    const httpServer = createServer(app);
    const handle = createEventWebSocket(httpServer, { readSessionEvents: async () => [] });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const { port } = httpServer.address() as AddressInfo;

    const abcClient = new WebSocket(`ws://127.0.0.1:${port}/ws/sessions/abc/events`);
    const xyzClient = new WebSocket(`ws://127.0.0.1:${port}/ws/sessions/xyz/events`);
    const abcMessages: string[] = [];
    const xyzMessages: string[] = [];
    abcClient.on('message', (data) => abcMessages.push(data.toString()));
    xyzClient.on('message', (data) => xyzMessages.push(data.toString()));
    await Promise.all([
      new Promise<void>((resolve) => abcClient.once('open', () => resolve())),
      new Promise<void>((resolve) => xyzClient.once('open', () => resolve())),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const appended: SessionEvent[] = [
      {
        type: 'PromptSubmitted',
        sessionId: 'abc',
        prompt: 'hi',
        timestamp: '2026-04-20T10:00:01Z',
        source: { line: '{}', uuid: 'u2' },
      },
    ];
    handle.publish('abc', appended);
    await new Promise((resolve) => setTimeout(resolve, 20));

    abcClient.close();
    xyzClient.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    expect({
      abcPayloads: abcMessages.map((m) => JSON.parse(m)),
      xyzPayloads: xyzMessages.map((m) => JSON.parse(m)),
    }).toEqual({
      abcPayloads: [{ events: [] }, { events: appended }],
      xyzPayloads: [{ events: [] }],
    });
  });
});
