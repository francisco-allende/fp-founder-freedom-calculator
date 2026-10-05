import { useEffect } from 'react';
import { isStoredQualification, readJSON, STORAGE_KEYS } from '../lib/storage';

/** Where to send the visitor after the gate (SPEC §9). Empty storage falls back to /thanks. */
export function nextPath(): '/book' | '/thanks' {
  const q = readJSON(STORAGE_KEYS.qualification, isStoredQualification);
  return q?.qualified ? '/book' : '/thanks';
}

export default function Next() {
  useEffect(() => {
    const target = new URL(nextPath(), window.location.origin).toString();
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
