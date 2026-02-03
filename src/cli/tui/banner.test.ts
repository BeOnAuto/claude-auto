import { describe, expect, it } from 'vitest';

import { renderBanner } from './banner.js';

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, '');
}

describe('renderBanner', () => {
  it('returns large block-letter ASCII art for CLAUDE and AUTO', () => {
    const banner = renderBanner();
    const plain = stripAnsi(banner);
    const lines = plain.split('\n');

    expect({
      hasBlockArt: plain.includes('██'),
      hasBoxDrawing: plain.includes('╗'),
      hasMultipleLines: lines.length > 10,
    }).toEqual({
      hasBlockArt: true,
      hasBoxDrawing: true,
      hasMultipleLines: true,
    });
  });

  it('includes ANSI color codes', () => {
    const banner = renderBanner();
    expect(banner.includes(ESC)).toBe(true);
  });

  it('renders diagonal stripe bands to the right of the text', () => {
    const banner = renderBanner();
    const lines = banner.split('\n').filter((l) => l.length > 0);
    const linesWithMultipleColors = lines.filter((l) => {
      const colorMatches = l.match(new RegExp(`${ESC}\\[38;2;`, 'g'));
      return colorMatches && colorMatches.length > 2;
    });

    expect(linesWithMultipleColors.length).toBeGreaterThan(3);
  });

  it('uses all four brand colors in the stripes', () => {
    const banner = renderBanner();

    expect({
      hasRed: banner.includes(`${ESC}[38;2;236;63;74m`),
      hasOrange: banner.includes(`${ESC}[38;2;255;138;29m`),
      hasGreen: banner.includes(`${ESC}[38;2;94;199;45m`),
      hasBlue: banner.includes(`${ESC}[38;2;66;195;247m`),
    }).toEqual({
      hasRed: true,
      hasOrange: true,
      hasGreen: true,
      hasBlue: true,
    });
  });
});
