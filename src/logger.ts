import * as fs from 'node:fs';
import * as path from 'node:path';

export const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  pink: '\x1b[35m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[97m',
  magenta: '\x1b[35m',
} as const;

export type LogLevel =
  | 'ACK'
  | 'NACK'
  | 'ERROR'
  | 'WARN'
  | 'SKIP'
  | 'INFO'
  | 'DENIED'
  | 'CONTINUE';

const levelColors: Record<LogLevel, string> = {
  ACK: `${colors.bold}${colors.green}`,
  NACK: `${colors.bold}${colors.red}`,
  ERROR: `${colors.red}`,
  SKIP: `${colors.yellow}`,
  WARN: `${colors.pink}`,
  INFO: `${colors.dim}`,
  DENIED: `${colors.bold}${colors.magenta}`,
  CONTINUE: `${colors.bold}${colors.cyan}`,
};

export interface Logger {
  log: (level: LogLevel, message: string) => void;
  logError: (error: unknown, context?: string) => void;
  getLogFile: () => string;
}

export function createLogger(logDir: string, sessionId?: string): Logger {
  const hooksDir = path.join(logDir, 'hooks');
  let logFilePath: string | undefined;

  function ensureLogDir(): void {
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
  }

  function getLogFile(): string {
    if (logFilePath) {
      return logFilePath;
    }

    ensureLogDir();

    if (!sessionId) {
      logFilePath = path.join(hooksDir, 'unknown.log');
      return logFilePath;
    }

    const prefix = sessionId.slice(0, 8);

    const files = fs.readdirSync(hooksDir);
    const existing = files.find(
      (f) => f.startsWith(`${prefix}-`) && f.endsWith('.log')
    );
    if (existing) {
      logFilePath = path.join(hooksDir, existing);
      return logFilePath;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\.\d{3}Z$/, '');
    const filename = `${prefix}-${timestamp}.log`;
    logFilePath = path.join(hooksDir, filename);
    fs.appendFileSync(logFilePath, `session: ${sessionId}\n\n`);

    return logFilePath;
  }

  function log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const coloredLevel = `${levelColors[level]}${level}${colors.reset}`;
    const dimTimestamp = `${colors.dim}[${timestamp}]${colors.reset}`;
    const logFile = getLogFile();
    fs.appendFileSync(logFile, `${dimTimestamp} ${coloredLevel}: ${message}\n`);
  }

  function logError(error: unknown, context?: string): void {
    ensureLogDir();
    const timestamp = new Date().toISOString();
    const errorMsg =
      error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    const contextStr = context ? ` [${context}]` : '';
    const errLog = path.join(hooksDir, 'err.log');
    fs.appendFileSync(errLog, `[${timestamp}]${contextStr} ${errorMsg}\n\n`);
  }

  return {
    log,
    logError,
    getLogFile,
  };
}
