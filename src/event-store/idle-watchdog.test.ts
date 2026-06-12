import { describe, expect, it } from 'vitest';

import { createIdleWatchdog } from './idle-watchdog.js';

describe('createIdleWatchdog', () => {
  it('signals exit only when no subscribers and idle beyond the timeout', () => {
    const watchdog = createIdleWatchdog(1000);
    const start = Date.now();
    watchdog.recordActivity(start);

    expect({
      beforeTimeoutNoSubs: watchdog.shouldExit(0, start + 500),
      afterTimeoutNoSubs: watchdog.shouldExit(0, start + 1500),
      afterTimeoutWithSubs: watchdog.shouldExit(1, start + 1500),
    }).toEqual({
      beforeTimeoutNoSubs: false,
      afterTimeoutNoSubs: true,
      afterTimeoutWithSubs: false,
    });
  });
});
