import { revenueMin } from '../data/options';
import { QUALIFY_MIN_HOURS } from './constants';
import { nonNeg } from './math';

// SPEC §5.5. `reasons` are for internal tags only; never shown to the user.

export type QualifyReason = 'role' | 'revenue' | 'timeline' | 'hours';
export type Tier = 'core' | 'growth';

export interface QualifyInput {
  role: string;
  revenue: string;
  timeline: string;
  /** Realistic delegable hours/week. */
  delegableHours: number;
}

export interface Qualification {
  qualified: boolean;
  tier: Tier | null;
  reasons: QualifyReason[];
}

const QUALIFYING_TIMELINES = new Set(['Now', 'Within 90 days']);

export function qualify(input: QualifyInput): Qualification {
  const reasons: QualifyReason[] = [];
  // An unknown or empty band counts as $0.
  const revenue = revenueMin(input.revenue) ?? 0;

  if (input.role !== 'Founder / Owner') reasons.push('role');
  if (revenue < 500_000) reasons.push('revenue');
  if (!QUALIFYING_TIMELINES.has(input.timeline)) reasons.push('timeline');
  if (nonNeg(input.delegableHours) < QUALIFY_MIN_HOURS) reasons.push('hours');

  const qualified = reasons.length === 0;
  const tier: Tier | null = qualified ? (revenue >= 1_000_000 ? 'core' : 'growth') : null;
  return { qualified, tier, reasons };
}
