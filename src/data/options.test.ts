import { describe, expect, it } from 'vitest';
import { REVENUE_BANDS, ROLES, TIMELINES } from './options';

// Must be byte-identical to the HighLevel dropdown options, or the form prefill silently fails.
// Written with escapes so an editor can't swap the en dash (U+2013) for a hyphen.
const HIGHLEVEL = {
  roles: ['Founder / Owner', 'CEO (not owner)', 'Executive', 'Other'],
  revenue: ['< $250K', '$250K\u2013$500K', '$500K\u2013$1M', '$1M\u2013$5M', '$5M\u2013$20M', '$20M+'],
  timelines: ['Now', 'Within 90 days', '3\u20136 months', 'Just exploring'],
};

const bytes = (s: string) => Array.from(new TextEncoder().encode(s));

describe('options match HighLevel byte for byte', () => {
  it.each([
    ['roles', [...ROLES], HIGHLEVEL.roles],
    ['revenue', REVENUE_BANDS.map((b) => b.label), HIGHLEVEL.revenue],
    ['timelines', [...TIMELINES], HIGHLEVEL.timelines],
  ])('%s', (_name, ours, theirs) => {
    expect(ours.map(bytes)).toEqual(theirs.map(bytes));
  });

  it('ranges use the en dash (E2 80 93), never a hyphen or em dash', () => {
    for (const s of [...REVENUE_BANDS.map((b) => b.label), ...TIMELINES].filter((x) => /[0-9KM] ?[-\u2013\u2014] ?\$?[0-9]/.test(x))) {
      expect(s).toMatch(/\u2013/);
      expect(s).not.toMatch(/[-\u2014]/);
    }
  });
});
