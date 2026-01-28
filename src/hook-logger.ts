import * as fs from 'node:fs';
import * as path from 'node:path';

export interface HookLogEntry {
  hookName: string;
  timestamp: string;
  input: unknown;
  resolvedPaths?: object;
  reminderFiles?: string[];
  matchedReminders?: { name: string; priority: number }[];
  output: unknown;
  error?: string;
  durationMs?: number;
}

function sanitizeForFilename(hookName: string): string {
  return hookName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

export function writeHookLog(claudeDir: string, entry: HookLogEntry): void {
  const logsDir = path.join(claudeDir, 'logs', 'hooks');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const sanitizedName = sanitizeForFilename(entry.hookName);
  const logFilename = `${sanitizedName}-${entry.timestamp}.log`;
  const logPath = path.join(logsDir, logFilename);

  const lines: string[] = [];
  lines.push(`=== ${entry.hookName} hook log ===`);
  lines.push(`Timestamp: ${entry.timestamp}`);
  if (entry.durationMs !== undefined) {
    lines.push(`Duration: ${entry.durationMs}ms`);
  }
  lines.push('');

  lines.push('--- Input ---');
  lines.push(JSON.stringify(entry.input, null, 2));
  lines.push('');

  if (entry.resolvedPaths) {
    lines.push('--- Resolved Paths ---');
    for (const [key, value] of Object.entries(entry.resolvedPaths as Record<string, unknown>)) {
      lines.push(`  ${key}: ${String(value)}`);
    }
    lines.push('');
  }

  if (entry.reminderFiles) {
    lines.push(`--- Reminder Files Found (${entry.reminderFiles.length}) ---`);
    for (const file of entry.reminderFiles) {
      lines.push(`  ${file}`);
    }
    lines.push('');
  }

  if (entry.matchedReminders) {
    lines.push(`--- Matched Reminders (${entry.matchedReminders.length}) ---`);
    for (const r of entry.matchedReminders) {
      lines.push(`  ${r.name} (priority: ${r.priority})`);
    }
    lines.push('');
  }

  if (entry.error) {
    lines.push('--- Error ---');
    lines.push(entry.error);
    lines.push('');
  }

  lines.push('--- Output ---');
  lines.push(JSON.stringify(entry.output, null, 2));
  lines.push('');

  fs.writeFileSync(logPath, lines.join('\n'));
}
