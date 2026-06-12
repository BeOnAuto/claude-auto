import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionPicker } from './SessionPicker';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SessionPicker', () => {
  it('uses summary as the primary label and falls back to a truncated id when summary is empty', async () => {
    const summaries = [
      {
        sessionId: 'abc-123456789',
        eventCount: 12,
        firstTimestamp: '2026-04-20T10:00:00Z',
        lastTimestamp: '2026-04-20T11:00:00Z',
        summary: 'my first prompt summary',
      },
      {
        sessionId: 'empty-456789',
        eventCount: 3,
        firstTimestamp: '2026-04-19T09:00:00Z',
        lastTimestamp: '2026-04-19T09:30:00Z',
        summary: '',
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: summaries }))),
    );

    render(<SessionPicker onSelect={() => {}} />);
    const buttons = await screen.findAllByRole('button');

    expect(
      buttons.map((button) => ({
        label: button.querySelector('[data-testid="session-label"]')?.textContent,
        meta: button.querySelector('[data-testid="session-meta"]')?.textContent,
      })),
    ).toEqual([
      {
        label: 'my first prompt summary',
        meta: `12 events·${new Date('2026-04-20T11:00:00Z').toLocaleString()}`,
      },
      {
        label: 'empty-45…',
        meta: `3 events·${new Date('2026-04-19T09:30:00Z').toLocaleString()}`,
      },
    ]);
  });

  it('renders each session as a Ketchup dark-theme card with brand-token classes', async () => {
    const summaries = [
      {
        sessionId: 'abc-123',
        eventCount: 1,
        firstTimestamp: '2026-04-20T10:00:00Z',
        lastTimestamp: '2026-04-20T11:00:00Z',
        summary: 'summary',
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: summaries }))),
    );

    render(<SessionPicker onSelect={() => {}} />);
    const button = await screen.findByRole('button');

    expect({
      button: button.className,
      label: button.querySelector('[data-testid="session-label"]')?.className,
      meta: button.querySelector('[data-testid="session-meta"]')?.className,
    }).toEqual({
      button:
        'w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:bg-slate-50 dark:border-ketchup-divider dark:bg-ketchup-surface dark:shadow-none dark:hover:bg-ketchup-bg-soft',
      label: 'line-clamp-2 font-medium text-slate-800 dark:text-ketchup-text',
      meta: 'mt-1 flex gap-2 text-xs text-slate-500 dark:text-ketchup-text-3',
    });
  });

  it('highlights the selected session with a ring matching the Ketchup brand', async () => {
    const summaries = [
      {
        sessionId: 'alpha',
        eventCount: 1,
        firstTimestamp: 't',
        lastTimestamp: 't',
        summary: 'first',
      },
      {
        sessionId: 'beta',
        eventCount: 1,
        firstTimestamp: 't',
        lastTimestamp: 't',
        summary: 'second',
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: summaries }))),
    );

    render(<SessionPicker selectedId="alpha" onSelect={() => {}} />);
    const buttons = await screen.findAllByRole('button');

    expect({
      alphaHasInsetRing: buttons[0]?.className.includes('ring-2 ring-inset'),
      betaHasInsetRing: buttons[1]?.className.includes('ring-2 ring-inset'),
    }).toEqual({
      alphaHasInsetRing: true,
      betaHasInsetRing: false,
    });
  });
});
