import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './useAnimatedNumber';

/**
 * One staged reveal (design rule 8): after `delayMs` the figure appears and counts up from 0 to
 * `target` once. Later changes show the new value directly. With reduced motion (or no
 * requestAnimationFrame) the final value is shown from the start.
 */
export function useStagedCountUp(target: number, delayMs: number, durationMs = 700) {
  const reduced = prefersReducedMotion() || typeof requestAnimationFrame !== 'function';
  const [value, setValue] = useState(reduced ? target : 0);
  const [shown, setShown] = useState(reduced);
  const done = useRef(reduced);

  useEffect(() => {
    if (done.current) {
      setValue(target);
      return;
    }
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      done.current = true;
      setShown(true);
      setValue(target);
    };
    const timer = setTimeout(() => {
      setShown(true);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        setValue(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
        else finish();
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    // Browsers pause animation frames in background tabs; never leave a figure stuck mid-count.
    const safety = setTimeout(finish, delayMs + durationMs + 150);
    return () => {
      clearTimeout(timer);
      clearTimeout(safety);
      cancelAnimationFrame(raf);
    };
  }, [target, delayMs, durationMs]);

  return { value, shown };
}
