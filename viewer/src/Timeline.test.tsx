import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SessionEvent, Timeline } from './Timeline';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  closed = false;
  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}

function deliver(events: SessionEvent[]): void {
  const ws = MockWebSocket.instances.at(-1);
  ws?.onmessage?.({ data: JSON.stringify({ events }) });
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  const main = document.createElement('main');
  document.body.appendChild(main);
  Object.defineProperty(main, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(main, 'clientHeight', { configurable: true, value: 800 });
  main.scrollTop = 1200;
  main.scrollTo = vi.fn() as unknown as typeof main.scrollTo;
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.querySelector('main')?.remove();
});

describe('Timeline', () => {
  it('renders hook, file, session-start, and session-end events as compact metadata rows', async () => {
    const events: SessionEvent[] = [
      {
        type: 'SessionStarted',
        timestamp: 't0',
        sessionId: 'a',
        cwd: '/foo',
        gitBranch: 'main',
        version: '1',
        entrypoint: 'cli',
        source: {},
      },
      {
        type: 'HookExecuted',
        timestamp: 't1',
        sessionId: 'a',
        hookEvent: 'Stop',
        hookName: 'tcr',
        command: 'sh',
        source: {},
      },
      {
        type: 'FileModified',
        timestamp: 't2',
        sessionId: 'a',
        filePath: '/a',
        operation: 'update',
        source: {},
      },
      { type: 'SessionEnded', timestamp: 't3', sessionId: 'a', source: {} },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));

    expect({
      start: screen.getAllByTestId('session-divider')[0]?.textContent,
      hook: screen.getByTestId('hook-row').textContent,
      file: screen.getByTestId('file-row').textContent,
      end: screen.getAllByTestId('session-divider')[1]?.textContent,
    }).toEqual({
      start: 'Session started — /foo @ main',
      hook: 'hookStop:tcr',
      file: 'fileupdate /a',
      end: 'Session ended',
    });
  });

  it('renders a tool invocation as a card with the tool name and JSON-formatted input', () => {
    const events: SessionEvent[] = [
      {
        type: 'ToolInvoked',
        timestamp: 't1',
        sessionId: 'a',
        toolName: 'Bash',
        toolUseId: 'A',
        input: { command: 'ls -la' },
        source: {},
      },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));

    expect(screen.getByTestId('tool-card').textContent).toEqual('Bashcommand="ls -la"');
  });

  it('omits thought events with empty thinking text so only populated thoughts render', () => {
    const events: SessionEvent[] = [
      { type: 'ThoughtRecorded', timestamp: 't1', sessionId: 'a', thinking: '', signature: 'sig', source: {} },
      {
        type: 'ThoughtRecorded',
        timestamp: 't2',
        sessionId: 'a',
        thinking: 'real reasoning',
        signature: 'sig',
        source: {},
      },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    const cards = screen.queryAllByTestId('thought-card');

    expect(cards.map((card) => card.querySelector('div')?.textContent)).toEqual(['real reasoning']);
  });

  it('renders a thought as a collapsed disclosure with italic body when expanded', () => {
    const thinking = 'Let me reason through this carefully step by step';
    const events: SessionEvent[] = [
      { type: 'ThoughtRecorded', timestamp: 't1', sessionId: 'a', thinking, signature: 'sig', source: {} },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    const card = screen.getByTestId('thought-card');
    const body = card.querySelector('div');

    expect({
      initiallyOpen: card.hasAttribute('open'),
      bodyText: body?.textContent,
      bodyClasses: body?.className,
    }).toEqual({
      initiallyOpen: false,
      bodyText: thinking,
      bodyClasses: 'mt-2 whitespace-pre-wrap text-slate-600 italic dark:text-ketchup-text-2',
    });
  });

  it('renders an assistant response as a left-aligned chat bubble with the full text', () => {
    const fullText = 'Here is the full assistant response without truncation so the user can read everything';
    const events: SessionEvent[] = [
      { type: 'AssistantResponded', timestamp: 't1', sessionId: 'a', text: fullText, source: {} },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    const bubble = screen.getByTestId('response-bubble');

    expect({
      alignment: bubble.className,
      text: bubble.firstElementChild?.textContent,
    }).toEqual({
      alignment: 'flex justify-start',
      text: fullText,
    });
  });

  it('renders a prompt event as a right-aligned chat bubble with the full prompt text', () => {
    const fullPrompt = 'Please summarize the session events for me in great detail with context';
    const events: SessionEvent[] = [
      { type: 'PromptSubmitted', timestamp: 't1', sessionId: 'a', prompt: fullPrompt, source: {} },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    const bubble = screen.getByTestId('prompt-bubble');

    expect({
      alignment: bubble.className,
      text: bubble.firstElementChild?.textContent,
    }).toEqual({
      alignment: 'flex justify-end',
      text: fullPrompt,
    });
  });

  it('appends events from subsequent websocket pushes to the existing timeline', () => {
    const firstEvents: SessionEvent[] = [
      {
        type: 'SessionStarted',
        timestamp: 't0',
        sessionId: 'a',
        cwd: '/w',
        gitBranch: 'main',
        version: '1',
        entrypoint: 'cli',
        source: {},
      },
    ];
    const secondEvents: SessionEvent[] = [
      {
        type: 'HookExecuted',
        timestamp: 't1',
        sessionId: 'a',
        hookEvent: 'Stop',
        hookName: 'tcr',
        command: 'sh',
        source: {},
      },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(firstEvents));
    act(() => deliver(secondEvents));
    const items = screen.getAllByRole('listitem');

    expect(items.map((li) => li.textContent)).toEqual(['Session started — /w @ main', 'hookStop:tcr']);
  });

  it('hides a parent node children by default and reveals the tool result when the expand toggle is clicked', async () => {
    const fullOutput = 'line 1\nline 2\nlots of content that would otherwise be truncated at forty characters';
    const events: SessionEvent[] = [
      {
        type: 'ToolInvoked',
        timestamp: 't1',
        sessionId: 'a',
        toolName: 'Bash',
        toolUseId: 'A',
        input: {},
        source: {},
      },
      {
        type: 'ToolInvocationSucceeded',
        timestamp: 't2',
        sessionId: 'a',
        toolUseId: 'A',
        content: fullOutput,
        source: {},
      },
    ];
    const user = userEvent.setup();

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    const before = screen.queryAllByTestId('tool-result').length;
    await user.click(screen.getByRole('button', { name: /expand/i }));
    const after = screen.getByTestId('tool-result').textContent;

    expect({ before, after }).toEqual({
      before: 0,
      after: `✓ succeeded${fullOutput}`,
    });
  });

  it('renders tool cards and tree branches with Ketchup dark theme classes', () => {
    const events: SessionEvent[] = [
      {
        type: 'ToolInvoked',
        timestamp: 't1',
        sessionId: 'a',
        toolName: 'Bash',
        toolUseId: 'A',
        input: {},
        source: {},
      },
    ];

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));

    expect(screen.getByTestId('tool-card').className).toEqual(
      'rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-ketchup-divider dark:bg-ketchup-surface dark:shadow-none',
    );
  });

  it('auto-scrolls the main pane instantly on initial load and smoothly on subsequent deliveries', () => {
    const main = document.body.querySelector('main') as HTMLElement;
    const scrollCalls = (main.scrollTo as unknown as { mock: { calls: Array<[ScrollToOptions]> } }).mock.calls;

    render(<Timeline sessionId="abc" />);
    act(() =>
      deliver([
        {
          type: 'PromptSubmitted',
          timestamp: 't1',
          sessionId: 'a',
          prompt: 'hi',
          source: {},
        },
      ]),
    );
    const firstBehavior = scrollCalls.at(-1)?.[0].behavior;
    act(() =>
      deliver([
        {
          type: 'AssistantResponded',
          timestamp: 't2',
          sessionId: 'a',
          text: 'ok',
          source: {},
        },
      ]),
    );
    const secondBehavior = scrollCalls.at(-1)?.[0].behavior;

    expect({ firstBehavior, secondBehavior }).toEqual({
      firstBehavior: 'instant',
      secondBehavior: 'smooth',
    });
  });

  it('renders a failed tool invocation with the full error text', async () => {
    const fullError = 'Error: file not found\n  at handler.ts:42\n  at processor.ts:118';
    const events: SessionEvent[] = [
      {
        type: 'ToolInvoked',
        timestamp: 't1',
        sessionId: 'a',
        toolName: 'Read',
        toolUseId: 'B',
        input: {},
        source: {},
      },
      {
        type: 'ToolInvocationFailed',
        timestamp: 't2',
        sessionId: 'a',
        toolUseId: 'B',
        error: fullError,
        source: {},
      },
    ];
    const user = userEvent.setup();

    render(<Timeline sessionId="abc" />);
    act(() => deliver(events));
    await user.click(screen.getByRole('button', { name: /expand/i }));

    expect(screen.getByTestId('tool-result-failed').textContent).toEqual(`✗ failed${fullError}`);
  });
});
