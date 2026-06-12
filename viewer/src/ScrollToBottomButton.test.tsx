import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollToBottomButton } from './ScrollToBottomButton';

function createMain(): HTMLElement {
  const main = document.createElement('main');
  document.body.appendChild(main);
  Object.defineProperty(main, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(main, 'clientHeight', { configurable: true, value: 800 });
  main.scrollTop = 0;
  main.scrollTo = vi.fn() as unknown as typeof main.scrollTo;
  return main;
}

beforeEach(() => {
  createMain();
});

afterEach(() => {
  document.body.querySelector('main')?.remove();
});

describe('ScrollToBottomButton', () => {
  it('renders when the main pane is scrollable and jumps to the bottom on click', () => {
    const main = document.body.querySelector('main') as HTMLElement;

    render(<ScrollToBottomButton />);
    const initialButton = screen.queryByRole('button', { name: /scroll to bottom/i });
    if (initialButton) fireEvent.click(initialButton);

    main.scrollTop = 1200;
    fireEvent.scroll(main);
    const afterScrollButton = screen.queryByRole('button', { name: /scroll to bottom/i });

    expect({
      initialRendered: !!initialButton,
      hiddenAtBottom: !afterScrollButton,
      scrolledTo: (main.scrollTo as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0],
      positionedUnderMainPane: initialButton?.className.includes('left-[calc(50%+10.5rem)]'),
    }).toEqual({
      initialRendered: true,
      hiddenAtBottom: true,
      scrolledTo: { top: 2000 },
      positionedUnderMainPane: true,
    });
  });
});
