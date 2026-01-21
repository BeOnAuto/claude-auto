import { cosmiconfig } from 'cosmiconfig';

export interface KetchupConfig {
  validators?: {
    dirs?: string[];
    enabled?: boolean;
    mode?: 'on' | 'off' | 'warn';
  };
}

export async function loadConfig(searchFrom: string): Promise<KetchupConfig> {
  const explorer = cosmiconfig('ketchup');
  const result = await explorer.search(searchFrom);
  return result?.config ?? {};
}
