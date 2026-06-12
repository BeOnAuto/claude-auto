import { homedir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { deriveProjectDir } from './derive-project-dir.js';

describe('deriveProjectDir', () => {
  it('maps an absolute cwd into ~/.claude/projects with slashes flattened to dashes', () => {
    expect(deriveProjectDir('/Users/sam/Projects/xolvio/ketchup')).toEqual(
      `${homedir()}/.claude/projects/-Users-sam-Projects-xolvio-ketchup`,
    );
  });
});
