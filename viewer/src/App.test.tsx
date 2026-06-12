import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the viewer shell with tailwind utility classes and a placeholder', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: [] }))),
    );

    render(<App />);

    const shell = screen.getByRole('main').parentElement;

    expect({
      shellClasses: shell?.className,
      placeholder: screen.getByText(/pick a session/i).textContent,
    }).toEqual({
      shellClasses:
        'flex h-screen gap-4 overflow-hidden bg-white p-4 font-sans text-slate-900 dark:bg-ketchup-bg dark:text-ketchup-text',
      placeholder: 'Pick a session.',
    });
  });

  it('renders the repository name above the Ketchup Viewer title in the sidebar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/api/project')
          ? new Response(JSON.stringify({ name: 'ketchup' }))
          : new Response(JSON.stringify({ sessions: [] })),
      ),
    );

    render(<App />);
    const repoName = await screen.findByTestId('repo-name');

    expect({ text: repoName.textContent, classes: repoName.className }).toEqual({
      text: 'ketchup',
      classes: 'text-xs font-mono tracking-wide text-slate-500 uppercase dark:text-ketchup-text-3',
    });
  });

  it('renders the sidebar as a sticky full-height column that scrolls independently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: [] }))),
    );

    render(<App />);

    expect(screen.getByRole('complementary').className).toEqual(
      'flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-200 pr-4 dark:border-ketchup-divider',
    );
  });

  it('renders the viewer title with the Ketchup rainbow gradient class', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: [] }))),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: /ketchup viewer/i }).className).toEqual(
      'ketchup-brand-gradient text-xl font-semibold',
    );
  });

  it('constrains the main content area with min-w-0 so long content does not push the page wide', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sessions: [] }))),
    );

    render(<App />);

    expect(screen.getByRole('main').className).toEqual('min-w-0 flex-1 overflow-y-auto');
  });

  it('shows a session header with id and summary after the user picks a session', async () => {
    const sessions = [
      {
        sessionId: 'abc-12345678',
        eventCount: 5,
        firstTimestamp: '2026-04-20T10:00:00Z',
        lastTimestamp: '2026-04-20T11:00:00Z',
        summary: 'my first prompt',
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/events')
          ? new Response(JSON.stringify({ events: [] }))
          : new Response(JSON.stringify({ sessions })),
      ),
    );
    const user = userEvent.setup();

    render(<App />);
    const pickerButton = await screen.findByRole('button', { name: /my first prompt/i });
    await user.click(pickerButton);
    const header = await screen.findByTestId('session-header');

    expect(header.textContent).toEqual('session idabc-12345678copy resume commandmy first prompt');
  });
});
