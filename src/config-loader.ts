import { cosmiconfig } from 'cosmiconfig';

export const DEFAULT_AUTO_DIR = '.claude-auto';

export interface AutoConfig {
  /** Directory for claude-auto data (reminders, validators). Default: '.claude-auto' */
  autoDir?: string;
  validators?: {
    dirs?: string[];
    enabled?: boolean;
    mode?: 'on' | 'off' | 'warn';
  };
  reminders?: {
    dirs?: string[];
  };
}

export async function loadConfig(searchFrom: string): Promise<AutoConfig> {
  const explorer = cosmiconfig('claude-auto');
  const result = await explorer.search(searchFrom);
  return result?.config ?? {};
}
