import { describe, expect, it } from 'vitest';
import { REVENUE_BANDS, ROLES, TIMELINES } from '../../data/options';
import { qualify, type QualifyInput } from '../qualify';

const passing: QualifyInput = {
  role: 'Founder / Owner',
  revenue: '$1M–$5M',
  timeline: 'Now',
  delegableHours: 12,
};

describe('test 4: qualification truth table', () => {
  it('all rules pass → qualified', () => {
    expect(qualify(passing)).toEqual({ qualified: true, tier: 'core', reasons: [] });
  });

  it.each([
    ['role', { role: 'CEO (not owner)' }],
    ['revenue', { revenue: '$250K–$500K' }],
    ['timeline', { timeline: '3–6 months' }],
    ['hours', { delegableHours: 9.99 }],
  ] as const)('only %s fails → not qualified, reason recorded', (reason, patch) => {
    const result = qualify({ ...passing, ...patch });
    expect(result.qualified).toBe(false);
    expect(result.tier).toBeNull();
    expect(result.reasons).toEqual([reason]);
  });

  it('every non-founder role fails', () => {
    for (const role of ROLES.filter((r) => r !== 'Founder / Owner')) {
      expect(qualify({ ...passing, role }).reasons).toEqual(['role']);
    }
  });

  it('revenue boundary at $500K and tier boundary at $1M', () => {
    const expected: Record<string, ReturnType<typeof qualify>['tier']> = {
      '< $250K': null,
      '$250K–$500K': null,
      '$500K–$1M': 'growth',
      '$1M–$5M': 'core',
      '$5M–$20M': 'core',
      '$20M+': 'core',
    };
    for (const { label } of REVENUE_BANDS) {
      expect(qualify({ ...passing, revenue: label }).tier, label).toBe(expected[label]);
    }
  });

  it('timeline: only Now and Within 90 days qualify', () => {
    const ok = TIMELINES.filter((t) => qualify({ ...passing, timeline: t }).qualified);
    expect(ok).toEqual(['Now', 'Within 90 days']);
  });

  it('hours boundary: exactly 10 qualifies', () => {
    expect(qualify({ ...passing, delegableHours: 10 }).qualified).toBe(true);
  });

  it('collects every failing reason, and handles empty or garbage input', () => {
    expect(qualify({ role: '', revenue: '', timeline: '', delegableHours: Number.NaN }).reasons).toEqual([
      'role',
      'revenue',
      'timeline',
      'hours',
    ]);
  });
});
