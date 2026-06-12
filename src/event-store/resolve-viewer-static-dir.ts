import { resolve } from 'node:path';

export function resolveViewerStaticDir(options: { pluginRoot: string | undefined; scriptDir: string }): string {
  if (options.pluginRoot) {
    return `${options.pluginRoot}/viewer/dist`;
  }
  return resolve(options.scriptDir, '../viewer/dist');
}
