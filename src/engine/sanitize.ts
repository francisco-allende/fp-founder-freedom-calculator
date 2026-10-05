import { MAX_NAME_LENGTH } from './constants';

// C0/C1 controls, zero-width chars, and bidi overrides/isolates.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/g;
const TAGS = /<[^>]*>/g;

/**
 * Clean user-entered names for display and for the report URL.
 * Applied on encode and again on decode, because a URL is untrusted input.
 */
export function sanitizeName(input: unknown, max = MAX_NAME_LENGTH): string {
  if (typeof input !== 'string') return '';
  const cleaned = input
    .replace(TAGS, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ') // tabs/newlines become spaces before controls are dropped
    .replace(CONTROL_CHARS, '')
    .replace(/ {2,}/g, ' ')
    .trim();
  // Slice by code point so we never split a surrogate pair (emoji).
  return Array.from(cleaned).slice(0, max).join('').trim();
}
