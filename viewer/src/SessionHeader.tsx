export function SessionHeader({
  sessionId,
  summary,
  onCopy,
}: {
  sessionId: string;
  summary: string;
  onCopy: (command: string) => void;
}) {
  const resumeCommand = `claude --resume ${sessionId}`;
  return (
    <div data-testid="session-header" className="mb-4 border-b border-slate-200 pb-3 dark:border-ketchup-divider">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-ketchup-text-3">
          session id
        </span>
        <code className="font-mono text-xs text-slate-600 dark:text-ketchup-text-2">{sessionId}</code>
        <button
          type="button"
          onClick={() => onCopy(resumeCommand)}
          className="ml-auto cursor-pointer rounded-full border border-slate-200 px-3 py-0.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-ketchup-divider dark:text-ketchup-text-2 dark:hover:bg-ketchup-bg-soft"
        >
          copy resume command
        </button>
      </div>
      <div className="mt-2 text-sm text-slate-800 dark:text-ketchup-text">{summary}</div>
    </div>
  );
}
