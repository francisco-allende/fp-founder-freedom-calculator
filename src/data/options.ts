// Step 1 options. The HighLevel form dropdowns must use these exact labels (SPEC §9).

export const ROLES = ['Founder / Owner', 'CEO (not owner)', 'Executive', 'Other'] as const;
export type Role = (typeof ROLES)[number];

export const REVENUE_BANDS = [
  { label: '< $250K', min: 0 },
  { label: '$250K–$500K', min: 250_000 },
  { label: '$500K–$1M', min: 500_000 },
  { label: '$1M–$5M', min: 1_000_000 },
  { label: '$5M–$20M', min: 5_000_000 },
  { label: '$20M+', min: 20_000_000 },
] as const;
export type Revenue = (typeof REVENUE_BANDS)[number]['label'];

export const TIMELINES = ['Now', 'Within 90 days', '3–6 months', 'Just exploring'] as const;
export type Timeline = (typeof TIMELINES)[number];

export function revenueMin(label: string): number | null {
  const band = REVENUE_BANDS.find((b) => b.label === label);
  return band ? band.min : null;
}
