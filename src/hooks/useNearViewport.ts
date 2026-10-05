import { useEffect, useRef, useState } from 'react';

/** True once the element is within `margin` of the viewport (always true without IntersectionObserver). */
export function useNearViewport<T extends HTMLElement>(margin = '600px') {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, margin]);

  return [ref, near] as const;
}
