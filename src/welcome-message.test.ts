import { describe, expect, it } from 'vitest';

import { FIRST_SETUP_MESSAGE } from './welcome-message.js';

describe('FIRST_SETUP_MESSAGE', () => {
  it('contains setup directive with config skill reference', () => {
    expect(FIRST_SETUP_MESSAGE).toContain('/claude-auto:config show');
    expect(FIRST_SETUP_MESSAGE).toContain('CRITICAL');
  });

  it('instructs to not proceed with user request', () => {
    expect(FIRST_SETUP_MESSAGE).toContain('DO NOT proceed');
  });
});
