import { describe, expect, it } from 'vitest';

import { resolveClaudeDirFromScript } from './path-resolver.js';

describe('resolveClaudeDirFromScript', () => {
  it('resolves .claude dir two levels up from script directory', () => {
    const scriptDir = '/project/.claude-auto/scripts';

    const result = resolveClaudeDirFromScript(scriptDir);

    expect(result).toBe('/project/.claude');
  });

  it('handles trailing slashes in script directory', () => {
    const scriptDir = '/project/.claude-auto/scripts/';

    const result = resolveClaudeDirFromScript(scriptDir);

    expect(result).toBe('/project/.claude');
  });

  it('works with nested project paths', () => {
    const scriptDir = '/home/user/code/my-project/.claude-auto/scripts';

    const result = resolveClaudeDirFromScript(scriptDir);

    expect(result).toBe('/home/user/code/my-project/.claude');
  });
});
