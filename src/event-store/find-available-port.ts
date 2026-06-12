import { createServer } from 'node:net';

export async function findAvailablePort(startPort: number, maxTries: number): Promise<number> {
  for (let offset = 0; offset < maxTries; offset++) {
    const port = startPort + offset;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port in range ${startPort}..${startPort + maxTries - 1}`);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}
