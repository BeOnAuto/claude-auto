import { useEffect, useState } from 'react';

function canScrollDown(): boolean {
  const container = document.querySelector('main');
  if (!container) return false;
  const threshold = 40;
  return container.clientHeight + container.scrollTop < container.scrollHeight - threshold;
}

export function ScrollToBottomButton() {
  const [visible, setVisible] = useState(canScrollDown);

  useEffect(() => {
    const container = document.querySelector('main');
    if (!container) return;
    const onScroll = () => setVisible(canScrollDown());
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="scroll to bottom"
      onClick={() => {
        const container = document.querySelector('main');
        container?.scrollTo({ top: container.scrollHeight });
      }}
      className="fixed bottom-6 left-[calc(50%+10.5rem)] flex h-12 w-12 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:bg-slate-50 dark:border-ketchup-divider dark:bg-ketchup-surface dark:text-ketchup-text-2 dark:hover:bg-ketchup-bg-soft"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
