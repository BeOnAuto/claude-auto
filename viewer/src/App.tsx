import { useEffect, useState } from 'react';

import { ScrollToBottomButton } from './ScrollToBottomButton';
import { SessionHeader } from './SessionHeader';
import { SessionPicker, type SessionSummary } from './SessionPicker';
import { ThemeToggle } from './ThemeToggle';
import { Timeline } from './Timeline';

export function App() {
  const [selected, setSelected] = useState<SessionSummary | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    fetch('/api/project')
      .then((response) => response.json())
      .then((body: { name: string }) => setProjectName(body.name));
  }, []);

  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-white p-4 font-sans text-slate-900 dark:bg-ketchup-bg dark:text-ketchup-text">
      <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-200 pr-4 dark:border-ketchup-divider">
        <div className="mb-4">
          {projectName && (
            <div
              data-testid="repo-name"
              className="text-xs font-mono tracking-wide text-slate-500 uppercase dark:text-ketchup-text-3"
            >
              {projectName}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2">
            <h1 className="ketchup-brand-gradient text-xl font-semibold">Ketchup Viewer</h1>
            <span className="ml-auto">
              <ThemeToggle />
            </span>
          </div>
        </div>
        <SessionPicker onSelect={setSelected} selectedId={selected?.sessionId} />
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <>
            <SessionHeader
              sessionId={selected.sessionId}
              summary={selected.summary}
              onCopy={(command) => navigator.clipboard.writeText(command)}
            />
            <Timeline sessionId={selected.sessionId} />
          </>
        ) : (
          <p className="text-slate-500 dark:text-ketchup-text-3">Pick a session.</p>
        )}
      </main>
      <ScrollToBottomButton />
    </div>
  );
}
