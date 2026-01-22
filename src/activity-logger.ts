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
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${month}-${day} ${hours}:${minutes}:${seconds}`;
  const shortSessionId = sessionId.slice(-8);
  const entry = `${timestamp} [${shortSessionId}] ${hookName}: ${message}\n`;
  fs.appendFileSync(logPath, entry);
}
