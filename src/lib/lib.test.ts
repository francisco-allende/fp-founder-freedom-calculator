import { describe, expect, it } from 'vitest';
import { buildBookingSrc, buildFormSrc, looksLikeSubmitMessage, type GhlHidden } from './ghl';
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
      fft_roi_multiple: '4.60',
      fft_top_tasks: 'Sorting and answering email, Scheduling and rescheduling meetings, Booking travel',
      fft_report_url: 'https://example.com/report?d=abc+def',
      fft_qualified: 'yes',
      fft_tier: 'core',
      utm_source: 'meta',
      utm_content: 'ad3-expert',
    });
  });

  it('omits empty prefill values and writes no tier when not qualified', () => {
    const src = new URL(buildFormSrc('f', { firstName: '', role: '', revenue: '', timeline: '' }, { ...hidden, qualified: false, tier: null, utm: {} }));
    expect(src.searchParams.has('first_name')).toBe(false);
    expect(src.searchParams.get('fft_qualified')).toBe('no');
    expect(src.searchParams.get('fft_tier')).toBe('');
    expect(src.searchParams.has('utm_source')).toBe(false);
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
