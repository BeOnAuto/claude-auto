import type { Server } from 'node:http';

import { type WebSocket, WebSocketServer } from 'ws';

import type { SessionEvent } from './translate-session.js';

export interface EventWebSocketDeps {
  readSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
}

export interface EventWebSocketHandle {
  wss: WebSocketServer;
  publish: (sessionId: string, events: SessionEvent[]) => void;
}

const SESSION_PATH = /^\/ws\/sessions\/([^/]+)\/events$/;

export function createEventWebSocket(httpServer: Server, deps: EventWebSocketDeps): EventWebSocketHandle {
  const wss = new WebSocketServer({ noServer: true });
  const subscribersBySession = new Map<string, Set<WebSocket>>();

  httpServer.on('upgrade', (request, socket, head) => {
    const match = request.url ? SESSION_PATH.exec(request.url) : null;
    if (!match) {
      socket.destroy();
      return;
    }
    const sessionId = match[1];
    wss.handleUpgrade(request, socket, head, async (ws) => {
      const subscribers = subscribersBySession.get(sessionId) ?? new Set<WebSocket>();
      subscribers.add(ws);
      subscribersBySession.set(sessionId, subscribers);
      ws.on('close', () => {
        subscribers.delete(ws);
      });
      const events = await deps.readSessionEvents(sessionId);
      ws.send(JSON.stringify({ events }));
    });
  });

  function publish(sessionId: string, events: SessionEvent[]): void {
    const subscribers = subscribersBySession.get(sessionId);
    if (!subscribers) return;
    const payload = JSON.stringify({ events });
    for (const ws of subscribers) {
      ws.send(payload);
    }
  }

  return { wss, publish };
}
