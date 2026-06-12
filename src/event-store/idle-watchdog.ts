export interface IdleWatchdog {
  recordActivity(now: number): void;
  shouldExit(subscriberCount: number, now: number): boolean;
}

export function createIdleWatchdog(idleTimeoutMs: number): IdleWatchdog {
  let lastActivityAt = Date.now();
  return {
    recordActivity(now) {
      lastActivityAt = now;
    },
    shouldExit(subscriberCount, now) {
      return subscriberCount === 0 && now - lastActivityAt > idleTimeoutMs;
    },
  };
}
