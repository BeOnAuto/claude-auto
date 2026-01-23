import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_MINUTES = 60;

export interface CleanLogsResult {
  deleted: string[];
  kept: number;
}

export function cleanLogs(logsDir: string, maxAgeMinutes: number = DEFAULT_MINUTES): CleanLogsResult {
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  const deleted: string[] = [];
  let kept = 0;

  try {
    const files = readdirSync(logsDir);
    for (const file of files) {
      const filePath = join(logsDir, file);
      try {
        const stats = statSync(filePath);
        if (!stats.isFile()) continue;
        if (now - stats.mtimeMs > maxAgeMs) {
          unlinkSync(filePath);
          deleted.push(file);
        } else {
          kept++;
        }
      } catch {
        // Skip files we can't stat or delete
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return { deleted, kept };
}
