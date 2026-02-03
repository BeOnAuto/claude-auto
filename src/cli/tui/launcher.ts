import { isAutoConfigured } from './detect.js';
import type { Tui, TuiOptions } from './tui.js';
import { createTui } from './tui.js';

export type LaunchResult = { ok: true; tui: Tui } | { ok: false; reason: 'not-configured' };

export function launchTui(options: TuiOptions): LaunchResult {
  if (!isAutoConfigured(options.dir)) {
    return { ok: false, reason: 'not-configured' };
  }

  const tui = createTui(options);
  tui.render();
  return { ok: true, tui };
}
