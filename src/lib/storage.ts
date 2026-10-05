// sessionStorage can throw (private mode, blocked storage) or hold junk; never let that break the page.

export const STORAGE_KEYS = {
  wizard: 'fft.wizard.v1',
  qualification: 'fft.qualification.v1',
  utm: 'fft.utm.v1',
} as const;

export function readJSON<T>(key: string, isValid: (x: unknown) => x is T): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app still works, it just won't survive a refresh.
  }
}

export function removeKey(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** Stored before the gate form renders; read by /next, /book and /thanks (SPEC §4, §9). */
export interface StoredQualification {
  qualified: boolean;
  tier: 'core' | 'growth' | null;
  reportUrl: string;
  topTasks: string[];
}

export function isStoredQualification(x: unknown): x is StoredQualification {
  return (
    isRecord(x) &&
    typeof x.qualified === 'boolean' &&
    (x.tier === 'core' || x.tier === 'growth' || x.tier === null) &&
    typeof x.reportUrl === 'string' &&
    Array.isArray(x.topTasks) &&
    x.topTasks.every((t) => typeof t === 'string')
  );
}
