import { type ReactNode, useEffect, useRef, useState } from 'react';

import { buildEventTree, type TreeNode } from './event-tree';

type Base = { timestamp: string; sessionId: string; source: unknown };

export type SessionEvent =
  | (Base & { type: 'SessionStarted'; cwd: string; gitBranch: string; version: string; entrypoint: string })
  | (Base & { type: 'PromptSubmitted'; prompt: string })
  | (Base & { type: 'AssistantResponded'; text: string })
  | (Base & { type: 'ThoughtRecorded'; thinking: string; signature: string })
  | (Base & { type: 'ToolInvoked'; toolName: string; toolUseId: string; input: Record<string, unknown> })
  | (Base & { type: 'ToolInvocationSucceeded'; toolUseId: string; content: string })
  | (Base & { type: 'ToolInvocationFailed'; toolUseId: string; error: string })
  | (Base & { type: 'HookExecuted'; hookEvent: string; hookName: string; command: string })
  | (Base & { type: 'SubagentProgressed'; parentToolUseId: string })
  | (Base & { type: 'FileModified'; filePath: string; operation: 'create' | 'update' })
  | (Base & { type: 'SessionEnded' });

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatToolInput(input: Record<string, unknown>): string {
  return Object.entries(input)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ');
}

function summarize(event: SessionEvent): string {
  switch (event.type) {
    case 'SessionStarted':
      return `${event.cwd} @ ${event.gitBranch}`;
    case 'PromptSubmitted':
      return truncate(event.prompt, 80);
    case 'AssistantResponded':
      return truncate(event.text, 80);
    case 'ThoughtRecorded':
      return truncate(event.thinking, 80);
    case 'ToolInvoked':
      return event.toolName;
    case 'ToolInvocationSucceeded':
      return `✓ ${truncate(event.content, 40)}`;
    case 'ToolInvocationFailed':
      return `✗ ${truncate(event.error, 40)}`;
    case 'HookExecuted':
      return `${event.hookEvent}:${event.hookName}`;
    case 'SubagentProgressed':
      return `parent=${event.parentToolUseId}`;
    case 'FileModified':
      return `${event.operation} ${event.filePath}`;
    case 'SessionEnded':
      return '';
  }
}

function EventBody({ event, toggle }: { event: SessionEvent; toggle?: ReactNode }) {
  if (event.type === 'PromptSubmitted') {
    return (
      <div data-testid="prompt-bubble" className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-blue-500 px-4 py-2 text-white">
          {event.prompt}
        </div>
      </div>
    );
  }
  if (event.type === 'AssistantResponded') {
    return (
      <div data-testid="response-bubble" className="flex justify-start">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-slate-100 px-4 py-2 text-slate-900 dark:bg-slate-700 dark:text-slate-50">
          {event.text}
        </div>
      </div>
    );
  }
  if (event.type === 'ThoughtRecorded') {
    return (
      <details
        data-testid="thought-card"
        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-ketchup-divider dark:bg-ketchup-bg-soft"
      >
        <summary className="cursor-pointer text-slate-500 dark:text-ketchup-text-3">💭 Thought</summary>
        <div className="mt-2 whitespace-pre-wrap text-slate-600 italic dark:text-ketchup-text-2">{event.thinking}</div>
      </details>
    );
  }
  if (event.type === 'ToolInvoked') {
    return (
      <div
        data-testid="tool-card"
        className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-ketchup-divider dark:bg-ketchup-surface dark:shadow-none"
      >
        <div className="flex min-w-0 items-center gap-2">
          {toggle}
          <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-ketchup-bg-soft dark:text-ketchup-text-2">
            {event.toolName}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-500 dark:text-ketchup-text-3">
            {formatToolInput(event.input)}
          </span>
        </div>
      </div>
    );
  }
  if (event.type === 'ToolInvocationSucceeded') {
    return (
      <div
        data-testid="tool-result"
        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10"
      >
        <div className="mb-1 text-xs text-emerald-700 dark:text-emerald-300">✓ succeeded</div>
        <pre className="font-mono text-xs whitespace-pre-wrap break-words text-slate-700 dark:text-ketchup-text-2">
          {event.content}
        </pre>
      </div>
    );
  }
  if (event.type === 'ToolInvocationFailed') {
    return (
      <div
        data-testid="tool-result-failed"
        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-500/30 dark:bg-rose-500/10"
      >
        <div className="mb-1 text-xs text-rose-700 dark:text-rose-300">✗ failed</div>
        <pre className="font-mono text-xs whitespace-pre-wrap break-words text-slate-700 dark:text-ketchup-text-2">
          {event.error}
        </pre>
      </div>
    );
  }
  if (event.type === 'HookExecuted') {
    return (
      <div data-testid="hook-row" className="flex items-center gap-2 text-xs text-slate-500 dark:text-ketchup-text-3">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          hook
        </span>
        <span>
          {event.hookEvent}:{event.hookName}
        </span>
      </div>
    );
  }
  if (event.type === 'FileModified') {
    return (
      <div data-testid="file-row" className="flex items-center gap-2 text-xs text-slate-500 dark:text-ketchup-text-3">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
          file
        </span>
        <span>
          {event.operation} {event.filePath}
        </span>
      </div>
    );
  }
  if (event.type === 'SessionStarted') {
    return (
      <div
        data-testid="session-divider"
        className="my-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-ketchup-divider dark:text-ketchup-text-3"
      >
        Session started — {event.cwd} @ {event.gitBranch}
      </div>
    );
  }
  if (event.type === 'SessionEnded') {
    return (
      <div
        data-testid="session-divider"
        className="my-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-ketchup-divider dark:text-ketchup-text-3"
      >
        Session ended
      </div>
    );
  }
  return (
    <span data-testid="event-label">
      <strong>{event.type}</strong> — {event.timestamp} — {summarize(event)}
    </span>
  );
}

function EventNode({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const toggle = hasChildren ? (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      aria-label={expanded ? 'collapse' : 'expand'}
      className="cursor-pointer text-slate-400 hover:text-slate-700 dark:text-ketchup-text-3 dark:hover:text-ketchup-text"
    >
      {expanded ? '▾' : '▸'}
    </button>
  ) : null;
  return (
    <li data-level={depth} className="list-none">
      <EventBody event={node.event} toggle={toggle} />
      {hasChildren && expanded && (
        <ul className="ml-4 mt-2 space-y-2 border-l border-slate-200 pl-4 dark:border-ketchup-divider">
          {node.children.map((child, index) => (
            <EventNode key={`${child.event.type}-${index}-${child.event.timestamp}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Timeline({ sessionId }: { sessionId: string }) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const pinnedRef = useRef(true);
  const isFirstScrollRef = useRef(true);

  useEffect(() => {
    setEvents([]);
    isFirstScrollRef.current = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/sessions/${sessionId}/events`);
    ws.onmessage = (message) => {
      const payload = JSON.parse(message.data) as { events: SessionEvent[] };
      setEvents((prev) => [...prev, ...payload.events]);
    };
    return () => ws.close();
  }, [sessionId]);

  useEffect(() => {
    const container = document.querySelector('main');
    if (!container) return;
    const onScroll = () => {
      pinnedRef.current = container.clientHeight + container.scrollTop >= container.scrollHeight - 40;
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const container = document.querySelector('main');
    if (pinnedRef.current && events.length > 0 && container) {
      const behavior: ScrollBehavior = isFirstScrollRef.current ? 'instant' : 'smooth';
      isFirstScrollRef.current = false;
      container.scrollTo({ top: container.scrollHeight, behavior });
    }
  }, [events]);

  const tree = buildEventTree(events.filter((event) => !(event.type === 'ThoughtRecorded' && event.thinking === '')));

  return (
    <ul className="space-y-3">
      {tree.map((node, index) => (
        <EventNode key={`${node.event.type}-${index}-${node.event.timestamp}`} node={node} depth={1} />
      ))}
    </ul>
  );
}
