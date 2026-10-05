import { describe, expect, it } from 'vitest';
import * as copy from './copy';
import { TASKS } from './tasks';

/** Every string reachable from a value, including the output of copy functions. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return strings((value as (...a: string[]) => unknown)('X', 'Y'));
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('public copy rules (SPEC §6)', () => {
  const all = [...strings(copy), ...TASKS.flatMap((t) => [t.name, t.tip])];

  it('has no em dashes', () => {
    expect(all.filter((s) => s.includes('—'))).toEqual([]);
  });

  it('keeps "60%+" with the plus', () => {
    expect(copy.PAINS.map((p) => p.pct)).toContain('60%+');
  });

  it('never mentions MP3 or Spotify', () => {
    expect(all.filter((s) => /mp3|spotify/i.test(s))).toEqual([]);
  });

  it('shows the Freedom 40 guarantee only with its conditions', () => {
    expect(copy.GUARANTEES.freedom40.conditions).toMatch(/Delegation Mastermind/);
    expect(copy.GUARANTEES.freedom40.conditions).toMatch(/10 minutes daily/);
  });

  it('buttons do not use arrows', () => {
    expect(all.filter((s) => s.includes('→'))).toEqual([]);
  });
});
