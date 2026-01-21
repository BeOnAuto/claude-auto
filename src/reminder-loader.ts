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

export interface ReminderContext {
  hook: string;
  mode?: string;
  toolName?: string;
  [key: string]: unknown;
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

export function matchReminders(reminders: Reminder[], context: ReminderContext): Reminder[] {
  return reminders.filter((reminder) => {
    const conditions = Object.entries(reminder.when);
    if (conditions.length === 0) {
      return true;
    }
    return conditions.every(([key, value]) => context[key] === value);
  });
}

export function sortByPriority(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => b.priority - a.priority);
}
