import { createLogTailer } from './log-tailer.js';
import { renderScreen } from './screen.js';

export interface TuiOptions {
  dir: string;
  write: (s: string) => void;
  cols: number;
  rows: number;
}

export interface Tui {
  render(): void;
  resize(cols: number, rows: number): void;
  stop(): void;
  isStopped(): boolean;
}

export function createTui(options: TuiOptions): Tui {
  const { dir, write } = options;
  const ketchupDir = `${dir}/.ketchup`;
  let currentCols = options.cols;
  let currentRows = options.rows;
  let stopped = false;

  const tailer = createLogTailer(ketchupDir, () => {
    if (!stopped) render();
  });

  function render(): void {
    const logLines = tailer.readAll();
    const screen = renderScreen({ logLines, cols: currentCols, rows: currentRows });
    write(`\x1b[2J\x1b[H${screen}`);
  }

  function resize(cols: number, rows: number): void {
    currentCols = cols;
    currentRows = rows;
    if (!stopped) render();
  }

  function stop(): void {
    stopped = true;
    tailer.stop();
  }

  return {
    render,
    resize,
    stop,
    isStopped: () => stopped,
  };
}
