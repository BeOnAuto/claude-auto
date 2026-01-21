import * as fs from 'node:fs';
import * as path from 'node:path';

export function scanReminders(dir: string): string[] {
  const remindersDir = path.join(dir, 'reminders');

  if (!fs.existsSync(remindersDir)) {
    return [];
  }

  return fs.readdirSync(remindersDir).filter((f) => f.endsWith('.md'));
}
