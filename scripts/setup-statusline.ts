#!/usr/bin/env npx tsx
import * as os from 'node:os';
import * as path from 'node:path';

import { isStatusLineConfigured, setupStatusLine } from '../src/statusline-detector.js';

export interface SetupStatusLineResult {
  status: 'configured' | 'already-configured';
  scriptDest?: string;
  settingsPath?: string;
}

export function runSetupStatusLine(pluginRoot: string, homeDir: string): SetupStatusLineResult {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  const scriptSource = path.join(pluginRoot, 'scripts', 'statusline.sh');
  const scriptDest = path.join(homeDir, '.claude', 'statusline-command.sh');

  if (isStatusLineConfigured(settingsPath)) {
    return { status: 'already-configured', settingsPath };
  }

  setupStatusLine(scriptSource, scriptDest, settingsPath);
  return { status: 'configured', scriptDest, settingsPath };
}

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
if (pluginRoot) {
  const result = runSetupStatusLine(pluginRoot, os.homedir());
  console.log(JSON.stringify(result));
}
