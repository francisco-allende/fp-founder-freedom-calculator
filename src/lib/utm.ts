import { isRecord, readJSON, STORAGE_KEYS, writeJSON } from './storage';

// SPEC §9: read utm_* on first load of any page; first touch wins.

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

const MAX_UTM_LENGTH = 100;

const isUtm = (x: unknown): x is Utm =>
  isRecord(x) && Object.entries(x).every(([k, v]) => (UTM_KEYS as readonly string[]).includes(k) && typeof v === 'string');

export function parseUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, MAX_UTM_LENGTH);
  }
  return utm;
}

/** Store UTMs from this URL unless an earlier visit already stored some. */
export function captureUtm(search: string): Utm {
  const existing = readJSON(STORAGE_KEYS.utm, isUtm);
  if (existing && Object.keys(existing).length > 0) return existing;
  const utm = parseUtm(search);
  if (Object.keys(utm).length > 0) writeJSON(STORAGE_KEYS.utm, utm);
  return utm;
}

export function getUtm(): Utm {
  return readJSON(STORAGE_KEYS.utm, isUtm) ?? {};
}

/**
 * First-touch UTMs without waiting for capture: what an earlier visit stored, else this URL's.
 * Lets the landing page match the ad on its very first render.
 */
export function firstTouchUtm(search: string): Utm {
  const stored = getUtm();
  return Object.keys(stored).length > 0 ? stored : parseUtm(search);
}
