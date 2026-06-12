import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SessionHeader } from './SessionHeader';

describe('SessionHeader', () => {
  it('shows a session id label and copies the resume command when the button is clicked', async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();

    render(<SessionHeader sessionId="abc-12345678" summary="hello" onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: /copy resume command/i }));

    expect({
      label: screen.getByText('session id').textContent,
      id: screen.getByText('abc-12345678').textContent,
      summary: screen.getByText('hello').textContent,
      copied: onCopy.mock.calls[0]?.[0],
    }).toEqual({
      label: 'session id',
      id: 'abc-12345678',
      summary: 'hello',
      copied: 'claude --resume abc-12345678',
    });
  });

  it('renders on Ketchup dark tokens with a pill-shaped copy button', () => {
    render(<SessionHeader sessionId="abc" summary="s" onCopy={() => {}} />);

    expect({
      wrapper: screen.getByTestId('session-header').className,
      button: screen.getByRole('button').className,
    }).toEqual({
      wrapper: 'mb-4 border-b border-slate-200 pb-3 dark:border-ketchup-divider',
      button:
        'ml-auto cursor-pointer rounded-full border border-slate-200 px-3 py-0.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-ketchup-divider dark:text-ketchup-text-2 dark:hover:bg-ketchup-bg-soft',
    });
  });
});
