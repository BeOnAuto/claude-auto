import fs from 'fs';
import path from 'path';

export function debugLog(
  claudeDir: string,
  hookName: string,
  message: string
): void {
  const debug = process.env.DEBUG;
  if (!debug || !debug.includes('ketchup')) {
    return;
  }

  const logsDir = path.join(claudeDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logPath = path.join(logsDir, 'ketchup.log');
  const entry = `[${hookName}] ${message}\n`;
  fs.appendFileSync(logPath, entry);
}
