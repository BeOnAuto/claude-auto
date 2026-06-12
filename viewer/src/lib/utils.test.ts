import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('merges tailwind classes with later values winning conflicts and drops falsy inputs', () => {
    const result = cn('p-2', 'text-sm', false && 'hidden', 'p-4', undefined, ['block', 'rounded']);
    expect(result).toEqual('text-sm p-4 block rounded');
  });
});
