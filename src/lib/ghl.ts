import type { Utm } from './utm';

// HighLevel embeds (SPEC §9). The query keys below must match each field's
// "query key" in the GHL form builder for "FP | Francisco Allende | Qualifying Form".

export const GHL_FORM_BASE = 'https://api.leadconnectorhq.com/widget/form/';
export const GHL_BOOKING_BASE = 'https://api.leadconnectorhq.com/widget/booking/';
/** Full-page version of the Matching Call scheduler (fallback link under the embed on /book). */
export const GHL_BOOKING_FULLSCREEN = 'https://api.leadconnectorhq.com/widget/bookings/fp-francisco-allende-matching';
export const GHL_EMBED_SCRIPT = 'https://link.msgsndr.com/js/form_embed.js';
/** Origins a GHL iframe can post messages from. */
export const GHL_ORIGIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*(leadconnectorhq\.com|msgsndr\.com)$/i;

export interface GhlPrefill {
  firstName: string;
  role: string;
  revenue: string;
  timeline: string;
}

export interface GhlHidden {
  delegableHours: number;
  hoursLow: number;
  monthlyCost: number;
  annualCost: number;
  roiMultiple: number;
  topTasks: string[];
  reportUrl: string;
  qualified: boolean;
  tier: 'core' | 'growth' | null;
  utm: Utm;
}

/** The 13 hidden fields, by their GHL query key (SPEC §9). Every one is always sent, never empty. */
export const HIDDEN_KEYS = [
  'fft_delegable_hours',
  'fft_hours_low',
  'fft_monthly_cost',
  'fft_annual_cost',
  'fft_roi_multiple',
  'fft_top_tasks',
  'fft_report_url',
  'fft_qualified',
  'fft_tier',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
] as const;

/** Defaults for UTMs on direct visits (GA convention), so no hidden field is ever empty. */
export const UTM_FALLBACK = { utm_source: '(direct)', utm_medium: '(none)', utm_campaign: '(none)', utm_content: '(none)' } as const;

/** Plain number for GHL Number fields: no "$", no commas, no exponent, no padded zeros. */
const plain = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return String(Math.round((Number.isFinite(n) ? n : 0) * f) / f);
};

export function formParams(prefill: GhlPrefill, hidden: GhlHidden): URLSearchParams {
  const p = new URLSearchParams();
  if (prefill.firstName) p.set('first_name', prefill.firstName);
  if (prefill.role) p.set('fft_role', prefill.role);
  if (prefill.revenue) p.set('fft_revenue', prefill.revenue);
  if (prefill.timeline) p.set('fft_timeline', prefill.timeline);

  p.set('fft_delegable_hours', plain(hidden.delegableHours, 1));
  p.set('fft_hours_low', plain(hidden.hoursLow, 1));
  p.set('fft_monthly_cost', plain(hidden.monthlyCost, 0));
  p.set('fft_annual_cost', plain(hidden.annualCost, 0));
  p.set('fft_roi_multiple', plain(hidden.roiMultiple, 2));
  p.set('fft_top_tasks', hidden.topTasks.slice(0, 3).join(', ') || 'none');
  p.set('fft_report_url', hidden.reportUrl);
  p.set('fft_qualified', hidden.qualified ? 'yes' : 'no');
  p.set('fft_tier', hidden.tier ?? 'none');
  for (const key of Object.keys(UTM_FALLBACK) as (keyof typeof UTM_FALLBACK)[]) {
    p.set(key, hidden.utm[key] || UTM_FALLBACK[key]);
  }
  return p;
}

/**
 * The same values for the parent page's URL. form_embed.js merges the parent URL's query into
 * what it hands the form, so mirroring them there covers both paths. UTM placeholders are left
 * out so GHL's own UTM tracking never records a fake source.
 */
export function parentPageParams(prefill: GhlPrefill, hidden: GhlHidden): URLSearchParams {
  const p = formParams(prefill, hidden);
  for (const key of Object.keys(UTM_FALLBACK) as (keyof typeof UTM_FALLBACK)[]) {
    if (!hidden.utm[key]) p.delete(key);
  }
  return p;
}

export function buildFormSrc(formId: string, prefill: GhlPrefill, hidden: GhlHidden): string {
  return `${GHL_FORM_BASE}${encodeURIComponent(formId)}?${formParams(prefill, hidden).toString()}`;
}

export function buildBookingSrc(calendarId: string, prefill: Partial<GhlPrefill> = {}): string {
  const p = new URLSearchParams();
  if (prefill.firstName) p.set('first_name', prefill.firstName);
  const qs = p.toString();
  return `${GHL_BOOKING_BASE}${encodeURIComponent(calendarId)}${qs ? `?${qs}` : ''}`;
}

/**
 * Best-effort detection of a successful submit message from the GHL iframe, used only
 * to reveal the "Continue" fallback. Verify the real payload in the live account.
 */
export function looksLikeSubmitMessage(origin: string, data: unknown): boolean {
  if (!GHL_ORIGIN_PATTERN.test(origin)) return false;
  let text: string;
  try {
    text = typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return false;
  }
  return /submit|success|thank/i.test(text ?? '');
}
