import * as fs from 'node:fs';

import { parseReminder, scanReminders, type ReminderWhen } from '../reminder-loader.js';

type ReminderInfo = {
  name: string;
  when: ReminderWhen;
  priority: number;
};

type RemindersResult = {
  reminders: ReminderInfo[];
};

export function listReminders(remindersDir: string): RemindersResult {
  const filenames = scanReminders(remindersDir);

  const reminders: ReminderInfo[] = filenames.map((filename) => {
    const content = fs.readFileSync(`${remindersDir}/${filename}`, 'utf-8');
    const parsed = parseReminder(content, filename);
    return {
      name: parsed.name,
      when: parsed.when,
      priority: parsed.priority,
    };
  });

  return { reminders };
}
