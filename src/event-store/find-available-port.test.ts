import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { findAvailablePort } from './find-available-port.js';

const openSockets: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(openSockets.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  openSockets.length = 0;
});

describe('findAvailablePort', () => {
  it('returns the first free port by probing real TCP sockets from the requested port', async () => {
    const blocker = createServer();
    openSockets.push(blocker);
    await new Promise<void>((resolve) => blocker.listen(50431, '127.0.0.1', resolve));

    const port = await findAvailablePort(50431, 3);

    expect(port).toBe(50432);
  });

  it('throws when every port in the range is busy', async () => {
    const blockerA = createServer();
    const blockerB = createServer();
    openSockets.push(blockerA, blockerB);
    await new Promise<void>((resolve) => blockerA.listen(50441, '127.0.0.1', resolve));
    await new Promise<void>((resolve) => blockerB.listen(50442, '127.0.0.1', resolve));

    await expect(findAvailablePort(50441, 2)).rejects.toThrow(/No free port/);
  });
});
