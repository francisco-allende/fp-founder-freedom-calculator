import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Some tests (the PDF renderer) run in the node environment, without a DOM.
if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  // jsdom does not implement scrolling.
  window.scrollTo = () => {};

  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
}
