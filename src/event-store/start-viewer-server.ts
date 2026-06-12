import type { Server } from 'node:http';

import type { Express } from 'express';

export async function startViewerServer(app: Express, port: number): Promise<Server> {
  return new Promise<Server>((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => resolve(server));
  });
}
