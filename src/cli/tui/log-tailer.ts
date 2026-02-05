import fs from 'node:fs';
import path from 'node:path';

export interface LogTailer {
  readAll(): string[];
  stop(): void;
}

export function createLogTailer(
  ketchupDir: string,
  onLine?: (line: string) => void,
  options?: { maxLines?: number },
): LogTailer {
  const logFile = path.join(ketchupDir, 'logs', 'activity.log');
  const maxLines = options?.maxLines;
  let lines: string[] = [];
  let watcher: fs.FSWatcher | undefined;
  let offset = 0;
  let stopped = false;

  function loadExisting(): void {
    if (!fs.existsSync(logFile)) return;
    const content = fs.readFileSync(logFile, 'utf-8');
    offset = Buffer.byteLength(content, 'utf-8');
    const raw = content.split('\n').filter((l) => l.length > 0);
    lines = maxLines ? raw.slice(-maxLines) : raw;
  }

  function pollNewLines(): void {
    if (stopped || !fs.existsSync(logFile)) return;
    const stat = fs.statSync(logFile);
    if (stat.size <= offset) return;

    const fd = fs.openSync(logFile, 'r');
    const buf = Buffer.alloc(stat.size - offset);
    fs.readSync(fd, buf, 0, buf.length, offset);
    fs.closeSync(fd);
    offset = stat.size;

    const chunk = buf.toString('utf-8');
    const newLines = chunk.split('\n').filter((l) => l.length > 0);
    for (const line of newLines) {
      lines.push(line);
      if (maxLines && lines.length > maxLines) {
        lines.shift();
      }
      onLine?.(line);
    }
  }

  loadExisting();

  if (onLine && fs.existsSync(logFile)) {
    watcher = fs.watch(path.dirname(logFile), () => {
      if (!stopped) pollNewLines();
    });

    const interval = setInterval(() => pollNewLines(), 100);

    watcher.on('close', () => clearInterval(interval));
  }

  return {
    readAll(): string[] {
      return [...lines];
    },
    stop(): void {
      stopped = true;
      watcher?.close();
    },
  };
}
