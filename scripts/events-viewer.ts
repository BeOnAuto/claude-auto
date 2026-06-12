#!/usr/bin/env npx tsx

import { basename, resolve } from 'node:path';

import { sqliteConnection } from '@event-driven-io/emmett-sqlite';

import { deriveProjectDir } from '../src/event-store/derive-project-dir.js';
import { createEventWebSocket } from '../src/event-store/event-websocket.js';
import { findAvailablePort } from '../src/event-store/find-available-port.js';
import { createIdleWatchdog } from '../src/event-store/idle-watchdog.js';
import { ingestProject } from '../src/event-store/ingest-project.js';
import { ingestSession } from '../src/event-store/ingest-session.js';
import { listSessions } from '../src/event-store/list-sessions.js';
import { readSessionEvents } from '../src/event-store/read-session-events.js';
import { resolveViewerStaticDir } from '../src/event-store/resolve-viewer-static-dir.js';
import { startViewerServer } from '../src/event-store/start-viewer-server.js';
import { createEventStore } from '../src/event-store/store.js';
import { createViewerApp } from '../src/event-store/viewer-server.js';
import { watchProject } from '../src/event-store/watch-project.js';

async function main(): Promise<void> {
  const dbPath = resolve(process.argv[2] ?? './events.db');
  const requestedPort = Number(process.argv[3] ?? 4321);
  const port = await findAvailablePort(requestedPort, 20);
  const projectDir = process.argv[4] ? resolve(process.argv[4]) : deriveProjectDir(process.cwd());

  const store = await createEventStore(dbPath);
  const connection = sqliteConnection({ fileName: dbPath });

  const staticDir = resolveViewerStaticDir({
    pluginRoot: process.env.CLAUDE_PLUGIN_ROOT,
    scriptDir: __dirname,
  });
  const app = createViewerApp({
    listSessions: () => listSessions(connection),
    readSessionEvents: (id) => readSessionEvents(store, id),
    staticDir,
    projectName: basename(process.cwd()),
  });
  const server = await startViewerServer(app, port);
  const wsHandle = createEventWebSocket(server, {
    readSessionEvents: (id) => readSessionEvents(store, id),
  });

  const idleTimeoutMinutes = Number(process.env.KETCHUP_VIEW_IDLE_MINUTES ?? 30);
  const watchdog = createIdleWatchdog(idleTimeoutMinutes * 60 * 1000);
  wsHandle.wss.on('connection', (socket) => {
    watchdog.recordActivity(Date.now());
    socket.on('close', () => watchdog.recordActivity(Date.now()));
  });
  setInterval(() => {
    if (watchdog.shouldExit(wsHandle.wss.clients.size, Date.now())) {
      console.log(`Idle for ${idleTimeoutMinutes}m with no clients, shutting down viewer`);
      process.exit(0);
    }
  }, 60_000);

  const ingestOne = async (jsonlPath: string) => {
    const newEvents = await ingestSession(jsonlPath, store);
    if (newEvents.length > 0) {
      wsHandle.publish(newEvents[0].sessionId, newEvents);
    }
  };

  console.log(`Watching ${projectDir} for jsonl changes`);
  await ingestProject(projectDir, store, async (path) => {
    await ingestOne(path);
  }).catch((error) => console.error('initial ingest skipped:', error.message));
  watchProject(projectDir, (path) => {
    ingestOne(path).catch((error) => console.error('watch ingest failed:', error.message));
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;
  console.log(`Viewer at http://127.0.0.1:${actualPort}`);
  console.log(`DB: ${dbPath}`);
}

main();
