import type { FSWatcher } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { type WatchFn, watchProject } from './watch-project.js';

describe('watchProject', () => {
  it('invokes the callback only for non-empty jsonl file names', () => {
    let listener: (event: string, name: string | null) => void = () => {};
    const close = vi.fn();
    const mockWatch: WatchFn = (_dir, l) => {
      listener = l;
      return { close } as unknown as FSWatcher;
    };
    const calls: string[] = [];

    const watcher = watchProject('/proj', (path) => calls.push(path), mockWatch);
    listener('change', 'a.jsonl');
    listener('change', 'b.txt');
    listener('change', null);
    watcher.close();

    expect({ calls, closed: close.mock.calls.length }).toEqual({
      calls: ['/proj/a.jsonl'],
      closed: 1,
    });
  });
});
