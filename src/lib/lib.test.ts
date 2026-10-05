import { describe, expect, it } from 'vitest';
import { buildBookingSrc, buildFormSrc, HIDDEN_KEYS, looksLikeSubmitMessage, parentPageParams, type GhlHidden } from './ghl';
import { captureUtm, getUtm, parseUtm } from './utm';

describe('utm', () => {
  it('parses only utm_* keys, trimmed and length-capped', () => {
    expect(parseUtm(`?utm_source=meta&utm_content=ad2-burned&fbclid=x&utm_medium=%20paid%20&utm_campaign=${'a'.repeat(300)}`)).toEqual({
      utm_source: 'meta',
      utm_medium: 'paid',
      utm_content: 'ad2-burned',
      utm_campaign: 'a'.repeat(100),
    });
  });

  it('first touch wins', () => {
    captureUtm('?utm_source=meta&utm_content=ad1-bottleneck');
    captureUtm('?utm_source=google&utm_content=ad5-hats');
    expect(getUtm()).toEqual({ utm_source: 'meta', utm_content: 'ad1-bottleneck' });
  });

  it('a visit without UTMs does not block a later tagged one', () => {
    captureUtm('');
    captureUtm('?utm_source=meta');
    expect(getUtm()).toEqual({ utm_source: 'meta' });
  });
});

describe('ghl', () => {
  const hidden: GhlHidden = {
    delegableHours: 16.05,
    hoursLow: 11.235,
    monthlyCost: 13_803.0,
    annualCost: 165_636.4,
    roiMultiple: 4.601,
    topTasks: ['Sorting and answering email', 'Scheduling and rescheduling meetings', 'Booking travel', 'Extra'],
    reportUrl: 'https://example.com/report?d=abc+def',
    qualified: true,
    tier: 'core',
    utm: { utm_source: 'meta', utm_content: 'ad3-expert' },
  };

  it('builds the form src with prefill, hidden fields and UTMs', () => {
    const src = new URL(
      buildFormSrc('FORM 1', { firstName: 'Fran', role: 'Founder / Owner', revenue: '$1M–$5M', timeline: 'Now' }, hidden),
    );
    expect(src.origin + src.pathname).toBe('https://api.leadconnectorhq.com/widget/form/FORM%201');
    expect(Object.fromEntries(src.searchParams)).toEqual({
      first_name: 'Fran',
      fft_role: 'Founder / Owner',
      fft_revenue: '$1M–$5M',
      fft_timeline: 'Now',
      fft_delegable_hours: '16.1',
      fft_hours_low: '11.2',
      fft_monthly_cost: '13803',
      fft_annual_cost: '165636',
      fft_roi_multiple: '4.6',
      fft_top_tasks: 'Sorting and answering email, Scheduling and rescheduling meetings, Booking travel',
      fft_report_url: 'https://example.com/report?d=abc+def',
      fft_qualified: 'yes',
      fft_tier: 'core',
      utm_source: 'meta',
      utm_content: 'ad3-expert',
      utm_medium: '(none)',
      utm_campaign: '(none)',
    });
  });

  it('omits empty prefill values; tier and UTMs fall back to placeholders, never empty', () => {
    const src = new URL(buildFormSrc('f', { firstName: '', role: '', revenue: '', timeline: '' }, { ...hidden, qualified: false, tier: null, utm: {} }));
    expect(src.searchParams.has('first_name')).toBe(false);
    expect(src.searchParams.get('fft_qualified')).toBe('no');
    expect(src.searchParams.get('fft_tier')).toBe('none');
    expect(src.searchParams.get('utm_source')).toBe('(direct)');
    expect(src.searchParams.get('utm_content')).toBe('(none)');
  });

  it('all 13 hidden keys are always present and non-empty, whatever the inputs', () => {
    const cases: GhlHidden[] = [
      hidden,
      { ...hidden, qualified: false, tier: null, utm: {}, topTasks: [] },
      { ...hidden, delegableHours: 0, hoursLow: 0, monthlyCost: 0, annualCost: 0, roiMultiple: 0 },
      { ...hidden, delegableHours: Number.NaN, monthlyCost: Number.POSITIVE_INFINITY },
    ];
    for (const h of cases) {
      const p = new URL(buildFormSrc('f', { firstName: '', role: '', revenue: '', timeline: '' }, h)).searchParams;
      expect(HIDDEN_KEYS).toHaveLength(13);
      for (const key of HIDDEN_KEYS) expect(p.get(key), key).toMatch(/\S/);
    }
  });

  it('Number-type fields are plain numbers: digits and one optional dot, no $, commas or exponent', () => {
    const values = [0, 0.04, 1.25, 16.05, 999.95, 13_803.4, 1_234_567.89, 4.601, 1e-7, 3.999];
    for (const v of values) {
      const p = new URL(
        buildFormSrc('f', { firstName: '', role: '', revenue: '', timeline: '' }, {
          ...hidden,
          delegableHours: v,
          hoursLow: v * 0.7,
          monthlyCost: v * 860,
          annualCost: v * 10_320,
          roiMultiple: v / 3,
        }),
      ).searchParams;
      for (const key of ['fft_delegable_hours', 'fft_hours_low', 'fft_monthly_cost', 'fft_annual_cost', 'fft_roi_multiple']) {
        expect(p.get(key), `${key}=${p.get(key)} for ${v}`).toMatch(/^\d+(\.\d+)?$/);
      }
      expect(p.get('fft_monthly_cost')).not.toContain('.');
      expect(p.get('fft_annual_cost')).not.toContain('.');
    }
  });

  it('parent-page params carry the same fields but never fake UTMs', () => {
    const prefill = { firstName: 'Fran', role: 'Founder / Owner', revenue: '$1M–$5M', timeline: 'Now' };
    const p = parentPageParams(prefill, { ...hidden, utm: { utm_source: 'meta' } });
    expect(p.get('fft_delegable_hours')).toBe('16.1');
    expect(p.get('fft_report_url')).toBe(hidden.reportUrl);
    expect(p.get('utm_source')).toBe('meta');
    expect(p.has('utm_medium')).toBe(false);
    expect(p.has('utm_content')).toBe(false);
  });

  it('builds the booking src', () => {
    expect(buildBookingSrc('cal1')).toBe('https://api.leadconnectorhq.com/widget/booking/cal1');
    expect(buildBookingSrc('cal1', { firstName: 'Fran' })).toBe('https://api.leadconnectorhq.com/widget/booking/cal1?first_name=Fran');
  });

  it('only trusts submit messages from GHL origins', () => {
    expect(looksLikeSubmitMessage('https://api.leadconnectorhq.com', { type: 'form-submitted' })).toBe(true);
    expect(looksLikeSubmitMessage('https://link.msgsndr.com', 'thank you')).toBe(true);
    expect(looksLikeSubmitMessage('https://api.leadconnectorhq.com', { type: 'resize', height: 400 })).toBe(false);
    expect(looksLikeSubmitMessage('https://evil.example', { type: 'form-submitted' })).toBe(false);
    expect(looksLikeSubmitMessage('https://leadconnectorhq.com.evil.example', 'submit')).toBe(false);
  });
});
