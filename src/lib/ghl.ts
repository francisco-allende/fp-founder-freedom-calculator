import type { Utm } from './utm';

// HighLevel embeds (SPEC §9). The query keys below must match each field's
// "query key" in the GHL form builder for "FP | Francisco Allende | Qualifying Form".

export const GHL_FORM_BASE = 'https://api.leadconnectorhq.com/widget/form/';
export const GHL_BOOKING_BASE = 'https://api.leadconnectorhq.com/widget/booking/';
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

/** Whole numbers for money, one decimal for hours, two for the multiple: what the email templates print. */
export function formParams(prefill: GhlPrefill, hidden: GhlHidden): URLSearchParams {
  const p = new URLSearchParams();
  if (prefill.firstName) p.set('first_name', prefill.firstName);
  if (prefill.role) p.set('fft_role', prefill.role);
  if (prefill.revenue) p.set('fft_revenue', prefill.revenue);
  if (prefill.timeline) p.set('fft_timeline', prefill.timeline);

  p.set('fft_delegable_hours', hidden.delegableHours.toFixed(1));
  p.set('fft_hours_low', hidden.hoursLow.toFixed(1));
  p.set('fft_monthly_cost', Math.round(hidden.monthlyCost).toString());
  p.set('fft_annual_cost', Math.round(hidden.annualCost).toString());
  p.set('fft_roi_multiple', hidden.roiMultiple.toFixed(2));
  p.set('fft_top_tasks', hidden.topTasks.slice(0, 3).join(', '));
  p.set('fft_report_url', hidden.reportUrl);
  p.set('fft_qualified', hidden.qualified ? 'yes' : 'no');
  p.set('fft_tier', hidden.tier ?? '');
  for (const [key, value] of Object.entries(hidden.utm)) if (value) p.set(key, value);
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
