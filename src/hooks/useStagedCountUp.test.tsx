import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStagedCountUp } from './useStagedCountUp';

function Probe({ target, delay }: { target: number; delay: number }) {
  const { value, shown } = useStagedCountUp(target, delay, 300);
  return <output data-shown={String(shown)}>{Math.round(value)}</output>;
}

describe('useStagedCountUp', () => {
  afterEach(() => vi.useRealTimers());

  it('reaches the final value even if animation frames never fire (background tab)', () => {
    vi.useFakeTimers();
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    const { container } = render(<Probe target={165636} delay={900} />);
    const out = container.querySelector('output')!;
    expect(out.dataset.shown).toBe('false');
    act(() => {
      vi.advanceTimersByTime(900 + 300 + 200);
    });
    expect(out.dataset.shown).toBe('true');
    expect(out.textContent).toBe('165636');
    raf.mockRestore();
  });
});
