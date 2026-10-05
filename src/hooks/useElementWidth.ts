import { useEffect, useRef, useState } from 'react';

/** Live width of an element, for layouts that must scale with their container (charts). */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // offsetWidth is the layout width, unaffected by CSS transforms (the landing preview is scaled).
    const measure = () => setWidth(el.offsetWidth || fallback);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);

  return [ref, width] as const;
}
