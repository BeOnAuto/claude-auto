import fs from 'node:fs';
import path from 'node:path';

export function debugLog(claudeDir: string, hookName: string, message: string): void {
  const debug = process.env.DEBUG;
  if (!debug || !debug.includes('ketchup')) {
    return;
  }

  const logsDir = path.join(claudeDir, 'logs', 'ketchup');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logPath = path.join(logsDir, 'debug.log');
  const timestamp = new Date().toISOString();
  const entry = `${timestamp} [${hookName}] ${message}\n`;
  fs.appendFileSync(logPath, entry);
}
