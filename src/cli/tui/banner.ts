const R = '\x1b[0m';
const rgb = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;

const orange = rgb(255, 138, 29);
const blue = rgb(66, 195, 247);
const red = rgb(236, 63, 74);
const green = rgb(94, 199, 45);
const gray = rgb(180, 180, 180);

const stripeColors = [red, orange, green, blue];
const bandWidth = 3;
const gapWidth = 2;
const stripeStart = 62;
const slopeMultiplier = 2;

function parseAnsiTokens(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === '\x1b') {
      const end = line.indexOf('m', i);
      if (end >= 0) {
        tokens.push(line.slice(i, end + 1));
        i = end + 1;
        continue;
      }
    }
    tokens.push(line[i]);
    i++;
  }

  return tokens;
}

function overlayStripes(line: string, plainLen: number, row: number, totalWidth: number): string {
  const tokens = parseAnsiTokens(line);

  let visibleCount = 0;
  for (const t of tokens) {
    if (!t.startsWith('\x1b')) visibleCount++;
  }
  for (let p = visibleCount; p < totalWidth; p++) {
    tokens.push(' ');
  }

  const result: string[] = [];
  let visibleCol = 0;

  for (const token of tokens) {
    if (token.startsWith('\x1b')) {
      result.push(token);
      continue;
    }

    if (visibleCol >= plainLen) {
      const stripe = getStripeColor(visibleCol, row);
      result.push(stripe ? `${stripe}█${R}` : token);
    } else {
      result.push(token);
    }
    visibleCol++;
  }

  return result.join('');
}

function getStripeColor(col: number, row: number): string | null {
  const diag = col + row * slopeMultiplier;

  for (let i = 0; i < stripeColors.length; i++) {
    const bandStart = stripeStart + i * (bandWidth + gapWidth);
    const bandEnd = bandStart + bandWidth;
    if (diag >= bandStart && diag < bandEnd) {
      return stripeColors[i];
    }
  }

  return null;
}

export function renderBanner(): string {
  const claudeLines = [
    { text: `${orange} ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗${R}`, len: 50 },
    { text: `${orange}██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝${R}`, len: 50 },
    { text: `${orange}██║     ██║     ███████║██║   ██║██║  ██║█████╗  ${R}`, len: 50 },
    { text: `${orange}██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ${R}`, len: 50 },
    { text: `${orange}╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗${R}`, len: 50 },
    { text: `${orange} ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝${R}`, len: 51 },
  ];

  const autoLines = [
    { text: `${gray} █████╗ ██╗   ██╗████████╗ ██████╗ ${R}`, len: 36 },
    { text: `${gray}██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗${R}`, len: 36 },
    { text: `${gray}███████║██║   ██║   ██║   ██║   ██║${R}`, len: 36 },
    { text: `${gray}██╔══██║██║   ██║   ██║   ██║   ██║${R}`, len: 36 },
    { text: `${gray}██║  ██║╚██████╔╝   ██║   ╚██████╔╝${R}`, len: 36 },
    { text: `${gray}╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ${R}`, len: 36 },
  ];

  const totalWidth = 85;
  const allRows = [...claudeLines, ...autoLines];

  const rendered = allRows.map((r, i) => overlayStripes(r.text, r.len, i, totalWidth));

  const lines = ['', ...rendered, ''];

  return lines.join('\n');
}
