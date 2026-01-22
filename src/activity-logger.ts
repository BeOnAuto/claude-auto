import fs from 'fs';
import path from 'path';

function matchesFilter(hookName: string, message: string): boolean {
  const filter = process.env.KETCHUP_LOG;
  if (!filter) {
    return true;
  }

  const patterns = filter.split(',').map((p) => p.trim());
  const includes = patterns.filter((p) => !p.startsWith('-'));
  const excludes = patterns.filter((p) => p.startsWith('-')).map((p) => p.slice(1));
  const searchText = `${hookName}: ${message}`;

  const excluded = excludes.some((pattern) => searchText.includes(pattern));
  if (excluded) {
    return false;
  }

  if (includes.length === 0 || includes.includes('*')) {
    return true;
  }

  return includes.some((pattern) => searchText.includes(pattern));
}

export function activityLog(
  claudeDir: string,
  sessionId: string,
  hookName: string,
  message: string
): void {
  if (!matchesFilter(hookName, message)) {
    return;
  }

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
