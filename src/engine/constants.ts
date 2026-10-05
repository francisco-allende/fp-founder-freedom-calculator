// Official numbers from paretotalent.com. Do not change without a source (SPEC §5.1, §6).

/** Pareto ROI section: $200 × 12.5 × 4.3 = $10,750. */
export const WEEKS_PER_MONTH = 4.3;
/** Founders save 10–15 hrs/wk in month 1. */
export const PARETO_BENCHMARK_HRS = { low: 10, high: 15, used: 12.5 } as const;
/** Annual plan: $36,000/yr. */
export const PROGRAM_MONTHLY_ANNUAL_PLAN = 3000;
export const PLACEMENT_FEE = 3000;
/** Year 1 all-in, each including the placement fee. */
export const YEAR1_ALL_IN = { annual: 39000, quarterly: 43000, monthly: 46200 } as const;
/** Hours back in first 30 days (Freedom 40 Guarantee, conditional). */
export const FREEDOM_40_HOURS = 40;

// Our own estimates (labeled "estimate" in the UI, SPEC §5.2–5.5).

/** Conservative factor for the low end of the range. ESTIMATE. */
export const CONSERVATIVE_FACTOR = 0.7;
/** Default effective hourly rate, same as paretotalent.com. */
export const DEFAULT_RATE = 200;
/** Working weeks per year used by the "Not sure?" rate helper. */
export const WORK_WEEKS_PER_YEAR = 48;
/** Minimum realistic delegable hours/week to qualify. */
export const QUALIFY_MIN_HOURS = 10;
/** Report URLs must stay under this length. */
export const MAX_REPORT_URL_LENGTH = 2000;
/** Max length of user-entered names (custom tasks, first name). */
export const MAX_NAME_LENGTH = 40;
