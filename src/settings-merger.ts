import * as fs from 'node:fs';
import * as path from 'node:path';

export function mergeSettings(packageDir: string, targetDir: string): void {
  const packageSettingsPath = path.join(
    packageDir,
    'templates',
    'settings.json'
  );
  const targetSettingsPath = path.join(targetDir, 'settings.json');

  if (fs.existsSync(packageSettingsPath)) {
    const packageSettings = fs.readFileSync(packageSettingsPath, 'utf-8');
    fs.writeFileSync(targetSettingsPath, packageSettings);
  }
}
