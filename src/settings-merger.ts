import * as fs from 'node:fs';
import * as path from 'node:path';

type HookEntry = {
  hooks: Array<{ type: string; command: string }>;
};

type HookOverride = {
  _disabled?: string[];
  _mode?: 'replace';
  _value?: HookEntry[];
};

type Settings = {
  hooks?: Record<string, HookEntry[] | HookOverride>;
  [key: string]: unknown;
};

function dedupeHooks(hooks: HookEntry[]): HookEntry[] {
  const seen = new Map<string, number>();
  hooks.forEach((entry, index) => {
    const command = entry.hooks[0]?.command;
    if (command) {
      seen.set(command, index);
    }
  });
  return hooks.filter((entry, index) => {
    const command = entry.hooks[0]?.command;
    return seen.get(command) === index;
  });
}

function isHookOverride(value: unknown): value is HookOverride {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ('_disabled' in value || '_mode' in value)
  );
}

function deepMergeSettings(base: Settings, override: Settings): Settings {
  const result: Settings = { ...base };

  for (const key of Object.keys(override)) {
    if (key === 'hooks' && base.hooks && override.hooks) {
      result.hooks = { ...base.hooks };
      for (const hookName of Object.keys(override.hooks)) {
        const overrideValue = override.hooks[hookName];

        if (isHookOverride(overrideValue)) {
          if (overrideValue._mode === 'replace') {
            result.hooks[hookName] = overrideValue._value || [];
          } else {
            const disabled = overrideValue._disabled || [];
            const baseHooks = (base.hooks[hookName] as HookEntry[]) || [];
            result.hooks[hookName] = baseHooks.filter((entry) => {
              const command = entry.hooks[0]?.command;
              return !disabled.includes(command);
            });
          }
        } else {
          const baseHooks = (base.hooks[hookName] as HookEntry[]) || [];
          const overrideHooks = overrideValue as HookEntry[];
          result.hooks[hookName] = dedupeHooks([...baseHooks, ...overrideHooks]);
        }
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
  const localSettingsPath = path.join(targetDir, 'settings.local.json');
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

  if (fs.existsSync(localSettingsPath)) {
    const localSettings: Settings = JSON.parse(
      fs.readFileSync(localSettingsPath, 'utf-8')
    );
    settings = deepMergeSettings(settings, localSettings);
  }

  fs.writeFileSync(targetSettingsPath, JSON.stringify(settings, null, 2));
}
