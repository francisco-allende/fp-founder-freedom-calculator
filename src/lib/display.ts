import { nonNeg } from '../engine/math';

// Presentation-only number formats for summary figures (design rule 7, SPEC §12b).
// The engine's formatters (src/engine/format.ts) stay the source for task-level rows.

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Whole hours: 11.24 → "11". */
export function hoursWhole(n: number): string {
  return whole.format(Math.round(nonNeg(n)));
}

/** "11–16"; collapses to one number when both ends round the same. */
export function hoursRange(low: number, high: number): string {
  const a = hoursWhole(low);
  const b = hoursWhole(high);
  return a === b ? b : `${a}–${b}`;
}

/**
 * Compact money: $940 · $9.7K · $13.8K · $116K · $1.2M.
 * One decimal below $100K (and below $10M), none above, so a figure never gets long enough to wrap.
 */
export function moneyCompact(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  const trim = (x: number, decimals: number) => {
    const f = 10 ** decimals;
    return String(Math.round(x * f) / f);
  };
  if (a < 1_000) return `${sign}$${Math.round(a)}`;
  if (a < 100_000) {
    const k = Math.round(a / 100) / 10;
    return k >= 100 ? `${sign}$${Math.round(a / 1_000)}K` : `${sign}$${trim(k, 1)}K`;
  }
  if (a < 999_500) return `${sign}$${Math.round(a / 1_000)}K`;
  if (a < 10_000_000) return `${sign}$${trim(a / 1_000_000, 1)}M`;
  return `${sign}$${Math.round(a / 1_000_000)}M`;
}

/** "$9.7K–$13.8K"; collapses to one figure when both ends format the same. */
export function moneyRange(low: number, high: number): string {
  const a = moneyCompact(low);
  const b = moneyCompact(high);
  return a === b ? b : `${a}–${b}`;
}
