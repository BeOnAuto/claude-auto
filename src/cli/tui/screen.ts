import { colors } from '../../logger.js';
import { renderBanner } from './banner.js';
import { colorizeLogLine } from './log-color.js';

export interface ScreenOptions {
  logLines: string[];
  cols: number;
  rows: number;
}

export function renderScreen(options: ScreenOptions): string {
  const { logLines, cols, rows } = options;
  const banner = renderBanner();
  const bannerLines = banner.split('\n');

  const separator = `${colors.dim}${'─'.repeat(Math.min(cols, 50))}${colors.reset}`;
  const header = `${colors.dim} activity log${colors.reset}`;

  const headerHeight = bannerLines.length + 2;
  const availableRows = Math.max(1, rows - headerHeight - 1);

  const output: string[] = [...bannerLines, separator, header];

  if (logLines.length === 0) {
    output.push(`${colors.dim}  waiting for activity...${colors.reset}`);
  } else {
    const visible = logLines.slice(-availableRows);
    for (const line of visible) {
      output.push(`  ${colorizeLogLine(line)}`);
    }
  }

  return output.join('\n');
}
