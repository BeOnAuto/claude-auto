import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseReminder, scanReminders, type ReminderWhen } from '../reminder-loader.js';

type ReminderInfo = {
  name: string;
  when: ReminderWhen;
  priority: number;
};

type RemindersResult = {
  reminders: ReminderInfo[];
};

export function listReminders(claudeDir: string): RemindersResult {
  const filenames = scanReminders(claudeDir);
  const remindersDir = path.join(claudeDir, 'reminders');

  const reminders: ReminderInfo[] = filenames.map((filename) => {
    const content = fs.readFileSync(path.join(remindersDir, filename), 'utf-8');
    const parsed = parseReminder(content, filename);
    return {
      name: parsed.name,
      when: parsed.when,
      priority: parsed.priority,
    };
  });

  return { reminders };
}
