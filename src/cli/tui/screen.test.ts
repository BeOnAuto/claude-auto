import { describe, expect, it } from 'vitest';

import { renderScreen } from './screen.js';

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, '');
}

describe('renderScreen', () => {
  it('renders banner followed by log lines', () => {
    const output = renderScreen({ logLines: ['line-A', 'line-B'], cols: 80, rows: 24 });
    const plain = stripAnsi(output);

    expect({
      hasBanner: plain.includes('█'),
      containsLogA: plain.includes('line-A'),
      containsLogB: plain.includes('line-B'),
    }).toEqual({
      hasBanner: true,
      containsLogA: true,
      containsLogB: true,
    });
  });

  it('renders empty state when no log lines', () => {
    const output = renderScreen({ logLines: [], cols: 80, rows: 24 });
    const plain = stripAnsi(output);

    expect({
      hasBanner: plain.includes('█'),
      containsWaiting: plain.includes('waiting'),
    }).toEqual({
      hasBanner: true,
      containsWaiting: true,
    });
  });

  it('includes a separator between banner and logs', () => {
    const output = renderScreen({ logLines: ['test'], cols: 80, rows: 24 });
    const plain = stripAnsi(output);

    expect(plain.includes('─')).toBe(true);
  });

  it('truncates log lines to fit available rows', () => {
    const manyLines = Array.from({ length: 50 }, (_, i) => `log-${i}`);
    const output = renderScreen({ logLines: manyLines, cols: 80, rows: 40 });
    const plain = stripAnsi(output);

    expect(plain.includes('log-49')).toBe(true);
    expect(plain.includes('log-0')).toBe(false);
  });
});
