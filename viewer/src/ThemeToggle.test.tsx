import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  document.documentElement.classList.add('dark');
  localStorage.clear();
});

afterEach(() => {
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('toggles the dark class on html and persists the preference when clicked', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);
    const afterFirst = {
      hasDark: document.documentElement.classList.contains('dark'),
      stored: localStorage.getItem('ketchup-theme'),
    };
    await user.click(button);
    const afterSecond = {
      hasDark: document.documentElement.classList.contains('dark'),
      stored: localStorage.getItem('ketchup-theme'),
    };

    expect({ afterFirst, afterSecond }).toEqual({
      afterFirst: { hasDark: false, stored: 'light' },
      afterSecond: { hasDark: true, stored: 'dark' },
    });
  });

  it('uses light defaults for border, text, and hover with dark-mode overrides', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });

    expect(button.className).toEqual(
      'cursor-pointer rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-ketchup-divider dark:text-ketchup-text-2 dark:hover:bg-ketchup-bg-soft',
    );
  });
});
