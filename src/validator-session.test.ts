import { describe, expect, it } from 'vitest';

import { isValidatorSession } from './validator-session.js';

describe('isValidatorSession', () => {
  it('returns true when prompt contains validator markers', () => {
    const prompt = `<diff>
some diff content
</diff>

<commit-message>
fix(core): do something
</commit-message>

<files>
src/foo.ts
</files>

You are a commit validator...`;

    expect(isValidatorSession(prompt)).toBe(true);
  });

  it('returns false when prompt is undefined', () => {
    expect(isValidatorSession(undefined)).toBe(false);
  });

  it('returns false when prompt is empty', () => {
    expect(isValidatorSession('')).toBe(false);
  });

  it('returns false for regular user prompts', () => {
    const prompt = 'Help me fix a bug in my code';
    expect(isValidatorSession(prompt)).toBe(false);
  });

  it('returns false when only diff tag is present', () => {
    const prompt = '<diff>some content</diff>';
    expect(isValidatorSession(prompt)).toBe(false);
  });

  it('returns true for batched validator prompts', () => {
    const prompt = `You are a commit validator evaluating a commit against multiple rule sets.

<diff>
changes here
</diff>

<commit-message>
feat(hooks): add feature
</commit-message>

<files>
src/hooks/hook.ts
</files>

<validator id="test-validator">
rules here
</validator>`;

    expect(isValidatorSession(prompt)).toBe(true);
  });
});
