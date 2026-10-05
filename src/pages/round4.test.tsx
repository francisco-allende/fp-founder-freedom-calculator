import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS, writeJSON } from '../lib/storage';
import Book from './Book';
import Calculator from './Calculator';

// Design round 4: mobile summary bar and booking fallback.

const renderCalculator = () =>
  render(
    <MemoryRouter>
      <Calculator />
    </MemoryRouter>,
  );

function toStep2() {
  const choose = (g: string, o: string) => fireEvent.click(within(screen.getByRole('group', { name: g })).getByRole('radio', { name: o }));
  choose('Your role', 'Founder / Owner');
  choose('Annual revenue', '$1M\u2013$5M');
  choose('When do you want help?', 'Now');
  fireEvent.click(screen.getByRole('button', { name: 'Pick my tasks' }));
}

describe('mobile summary bar', () => {
  it('holds the step’s Continue, so there is one sticky element', () => {
    renderCalculator();
    expect(screen.queryByTestId('summary-bar')).toBeNull(); // not on step 1
    toStep2();
    const bar = screen.getByTestId('summary-bar');
    fireEvent.click(within(bar).getByRole('button', { name: 'Continue to calendar' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Want a sharper result?' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId('summary-bar')).getByRole('button', { name: 'Go to my results' }));
    expect(screen.queryByTestId('summary-bar')).toBeNull(); // not on results
  });

  it('tapping the bar opens a bottom sheet with the full summary; Escape closes it and returns focus', () => {
    renderCalculator();
    toStep2();
    const open = within(screen.getByTestId('summary-bar')).getByRole('button', { name: /Open the full summary/ });
    open.focus();
    fireEvent.click(open);
    const sheet = screen.getByRole('dialog', { name: 'Your summary so far' });
    expect(within(sheet).getByText('Your week')).toBeInTheDocument();
    expect(within(sheet).getByText('That’s about 9 workdays back every month')).toBeInTheDocument();
    expect(document.activeElement).toBe(within(sheet).getByRole('button', { name: 'Close the summary' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('hides when the footer enters the viewport', () => {
    let fire: (visible: boolean) => void = () => {};
    class IO {
      constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
        fire = (visible) => cb([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', IO);
    try {
      renderCalculator();
      toStep2();
      const bar = screen.getByTestId('summary-bar');
      expect(bar.className).not.toMatch(/barHidden/);
      act(() => fire(true));
      expect(bar.className).toMatch(/barHidden/);
      act(() => fire(false));
      expect(bar.className).not.toMatch(/barHidden/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('/book', () => {
  it('always shows the full-screen scheduler fallback under the embed', () => {
    writeJSON(STORAGE_KEYS.qualification, { qualified: true, tier: 'core', reportUrl: 'https://x.test/report?d=x', firstName: 'Fran' });
    render(
      <MemoryRouter>
        <Book />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Prefer a full-screen scheduler\?/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Open it here/ });
    expect(link).toHaveAttribute('href', 'https://api.leadconnectorhq.com/widget/bookings/fp-francisco-allende-matching');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByTestId('summary-bar')).toBeNull();
  });
});
