import { GHL_EMBED_SCRIPT } from './ghl';

/**
 * Run HighLevel's form_embed.js for iframes that are already in the DOM.
 *
 * The script scans for /form and /booking iframes once, when it executes, and wires up
 * auto-resize plus the query-params handshake only for the iframes it finds. In a SPA the
 * iframe may mount after the script ran (or on a later client-side navigation), so we
 * re-insert a fresh <script> each time an embed mounts. Its own guards skip iframes it has
 * already initialized.
 */
export function runEmbedScript(): void {
  document.querySelectorAll(`script[src="${GHL_EMBED_SCRIPT}"]`).forEach((s) => s.remove());
  const s = document.createElement('script');
  s.src = GHL_EMBED_SCRIPT;
  s.async = true;
  document.body.appendChild(s);
}

/** `?debug=1` on any page turns on console logging of what we send to HighLevel (for DevTools). */
export function ghlDebugEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      window.sessionStorage.setItem('fft.debug', '1');
    }
    return window.sessionStorage.getItem('fft.debug') === '1';
  } catch {
    return false;
  }
}
