import { describe, expect, it } from 'vitest';

import { resolveViewerStaticDir } from './resolve-viewer-static-dir.js';

describe('resolveViewerStaticDir', () => {
  it('prefers the plugin root when set, else resolves relative to the script dir', () => {
    expect({
      withPluginRoot: resolveViewerStaticDir({ pluginRoot: '/opt/plugin', scriptDir: '/any/where' }),
      withoutPluginRoot: resolveViewerStaticDir({ pluginRoot: undefined, scriptDir: '/proj/scripts' }),
    }).toEqual({
      withPluginRoot: '/opt/plugin/viewer/dist',
      withoutPluginRoot: '/proj/viewer/dist',
    });
  });
});
