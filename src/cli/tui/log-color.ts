const R = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

const LOG_PATTERN = /^(\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\[[0-9a-f]+\]) (\S+:) (.*)$/;

const STATUS_STYLES: Array<{ pattern: RegExp; color: string }> = [
  { pattern: /\bNACK\b/g, color: `${BOLD}${RED}` },
  { pattern: /\bDENIED\b/g, color: `${BOLD}${RED}` },
  { pattern: /\bACK\b/g, color: `${BOLD}${GREEN}` },
  { pattern: /\bERROR\b/g, color: RED },
  { pattern: /\bWARN\b/g, color: YELLOW },
  { pattern: /\bSKIP\b/g, color: YELLOW },
];

function colorizeMessage(msg: string): string {
  let result = msg;
  for (const { pattern, color } of STATUS_STYLES) {
    result = result.replace(pattern, (match) => `${color}${match}${R}`);
  }
  return result;
}

export function colorizeLogLine(line: string): string {
  const match = LOG_PATTERN.exec(line);
  if (!match) {
    return `${DIM}${line}${R}`;
  }

  const [, timestamp, sessionId, hookName, message] = match;
  const coloredMessage = colorizeMessage(message);

  return `${DIM}${timestamp}${R} ${DIM}${sessionId}${R} ${CYAN}${hookName}${R} ${coloredMessage}`;
}
