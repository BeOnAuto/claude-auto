import * as fs from 'node:fs';
import * as path from 'node:path';

export function isStatusLineConfigured(settingsPath: string): boolean {
  if (!fs.existsSync(settingsPath)) return false;

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    return 'statusLine' in settings;
  } catch {
    return false;
  }
}

export function setupStatusLine(scriptSource: string, scriptDest: string, settingsPath: string): void {
  fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
  fs.copyFileSync(scriptSource, scriptDest);

  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {}
  }

  settings.statusLine = { type: 'command', command: `sh ${scriptDest}` };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}
