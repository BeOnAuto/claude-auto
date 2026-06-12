import { type FSWatcher, watch } from 'node:fs';
import { join } from 'node:path';

export type WatchFn = (dir: string, listener: (event: string, name: string | null) => void) => FSWatcher;

export function watchProject(
  projectDir: string,
  onJsonlChange: (jsonlPath: string) => void,
  watchFn: WatchFn = watch,
): FSWatcher {
  return watchFn(projectDir, (_event, fileName) => {
    if (!fileName?.endsWith('.jsonl')) return;
    onJsonlChange(join(projectDir, fileName));
  });
}
