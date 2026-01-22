import { cosmiconfig } from 'cosmiconfig';

export const DEFAULT_KETCHUP_DIR = '.ketchup';

export interface KetchupConfig {
  /** Directory for ketchup data (reminders, validators). Default: '.ketchup' */
  ketchupDir?: string;
  validators?: {
    dirs?: string[];
    enabled?: boolean;
    mode?: 'on' | 'off' | 'warn';
  };
  reminders?: {
    dirs?: string[];
  };
}

export async function loadConfig(searchFrom: string): Promise<KetchupConfig> {
  const explorer = cosmiconfig('ketchup');
  const result = await explorer.search(searchFrom);
  return result?.config ?? {};
}
