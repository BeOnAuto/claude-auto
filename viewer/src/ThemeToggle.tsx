import { useState } from 'react';

const STORAGE_KEY = 'ketchup-theme';

function readCurrentMode(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [mode, setMode] = useState<'dark' | 'light'>(readCurrentMode);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem(STORAGE_KEY, next);
    setMode(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="toggle theme"
      className="cursor-pointer rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-ketchup-divider dark:text-ketchup-text-2 dark:hover:bg-ketchup-bg-soft"
    >
      {mode === 'dark' ? '☾' : '☀'}
    </button>
  );
}
