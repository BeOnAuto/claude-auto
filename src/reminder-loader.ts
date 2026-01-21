import * as fs from 'node:fs';
import * as path from 'node:path';

import matter from 'gray-matter';

export interface ReminderWhen {
  hook?: string;
  mode?: string;
  toolName?: string;
  [key: string]: unknown;
}

export interface Reminder {
  name: string;
  when: ReminderWhen;
  priority: number;
  content: string;
}

export function scanReminders(dir: string): string[] {
  const remindersDir = path.join(dir, 'reminders');

  if (!fs.existsSync(remindersDir)) {
    return [];
  }

  return fs.readdirSync(remindersDir).filter((f) => f.endsWith('.md'));
}

export function parseReminder(content: string, filename: string): Reminder {
  const { data, content: body } = matter(content);
  const name = filename.replace(/\.md$/, '');

  return {
    name,
    when: (data.when as ReminderWhen) || {},
    priority: (data.priority as number) || 0,
    content: body.trim(),
  };
}
