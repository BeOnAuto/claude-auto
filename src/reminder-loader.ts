import * as fs from 'node:fs';
import * as path from 'node:path';

import matter from 'gray-matter';

import type { ReminderOverride } from './hook-state.js';

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

export function scanReminders(remindersDir: string): string[] {
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

export function loadReminders(
  dirs: string[],
  context: ReminderContext,
  overrides?: Record<string, ReminderOverride>,
): Reminder[] {
  const reminders: Reminder[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    const filenames = scanReminders(dir);
    for (const filename of filenames) {
      if (seen.has(filename)) {
        continue;
      }
      seen.add(filename);
      const content = fs.readFileSync(path.join(dir, filename), 'utf8');
      const reminder = parseReminder(content, filename);

      const override = overrides?.[reminder.name];
      if (override?.enabled === false) {
        continue;
      }
      if (override?.priority !== undefined) {
        reminder.priority = override.priority;
      }

      reminders.push(reminder);
    }
  }

  const matched = matchReminders(reminders, context);
  return sortByPriority(matched);
}
