import { useEffect, useRef, type ReactNode } from 'react';

/** Step title that takes focus after navigation, so keyboard and screen reader users land on it. */
export function StepHeading({ children, focus }: { children: ReactNode; focus: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return (
    <h1 ref={ref} tabIndex={-1}>
      {children}
    </h1>
  );
}
