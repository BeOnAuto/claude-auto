import * as fs from 'node:fs';
import * as path from 'node:path';

type Settings = {
  hooks?: Record<string, unknown[]>;
  [key: string]: unknown;
};

function deepMergeSettings(base: Settings, override: Settings): Settings {
  const result: Settings = { ...base };

  for (const key of Object.keys(override)) {
    if (key === 'hooks' && base.hooks && override.hooks) {
      result.hooks = { ...base.hooks };
      for (const hookName of Object.keys(override.hooks)) {
        const baseHooks = (base.hooks[hookName] as unknown[]) || [];
        const overrideHooks = override.hooks[hookName] as unknown[];
        result.hooks[hookName] = [...baseHooks, ...overrideHooks];
      }
    } else {
      result[key] = override[key];
    }
  }

  return result;
}

export function mergeSettings(packageDir: string, targetDir: string): void {
  const packageSettingsPath = path.join(
    packageDir,
    'templates',
    'settings.json'
  );
  const projectSettingsPath = path.join(targetDir, 'settings.project.json');
  const targetSettingsPath = path.join(targetDir, 'settings.json');

  if (!fs.existsSync(packageSettingsPath)) {
    return;
  }

  let settings: Settings = JSON.parse(
    fs.readFileSync(packageSettingsPath, 'utf-8')
  );

  if (fs.existsSync(projectSettingsPath)) {
    const projectSettings: Settings = JSON.parse(
      fs.readFileSync(projectSettingsPath, 'utf-8')
    );
    settings = deepMergeSettings(settings, projectSettings);
  }

  fs.writeFileSync(targetSettingsPath, JSON.stringify(settings, null, 2));
}
