import fs from 'fs';
import path from 'path';

export function activityLog(
  claudeDir: string,
  sessionId: string,
  hookName: string,
  message: string
): void {
  const logsDir = path.join(claudeDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logPath = path.join(logsDir, 'activity.log');
  const timestamp = new Date().toISOString();
  const shortSessionId = sessionId.slice(-8);
  const entry = `${timestamp} [${shortSessionId}] ${hookName}: ${message}\n`;
  fs.appendFileSync(logPath, entry);
}
