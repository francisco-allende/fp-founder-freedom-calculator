import { useEffect } from 'react';
import { completeRun, readCompletedRun } from '../lib/session';

/** Where to send the visitor after the gate (SPEC §9). Empty storage falls back to /thanks. */
export function nextPath(): '/book' | '/thanks' {
  return readCompletedRun()?.qualified ? '/book' : '/thanks';
}

/**
 * The gate was submitted: pick the destination from the stored qualification, then clear the
 * wizard so the next visit to /calculator starts clean (SPEC §4). Returns the absolute target.
 */
export function finishRun(): string {
  const target = new URL(nextPath(), window.location.origin).toString();
  completeRun();
  return target;
}

export default function Next() {
  useEffect(() => {
    const target = finishRun();
    // GHL may load this page inside its iframe; break out to the top window (same origin after redirect).
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.replace(target);
        return;
      }
    } catch {
      // Cross-origin top: fall through and navigate this frame.
    }
    window.location.replace(target);
  }, []);

  return (
    <main style={{ padding: 'var(--space-6) var(--gutter)' }}>
      <p role="status">Taking you to your report…</p>
    </main>
  );
}
