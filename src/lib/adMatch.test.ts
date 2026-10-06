import { describe, expect, it } from 'vitest';
import { AD_CREATIVES } from '../data/ads';
import { adForUtmContent, adImageSources } from './adMatch';

describe('ad-to-landing message match', () => {
  it.each([
    ['ad1-bottleneck', 1, "You're the bottleneck in your own company."],
    ['ad2-burned', 2, "You didn't fail at delegating."],
    ['ad3-expert', 3, "You didn't start your firm to answer email."],
    ['ad4-alwayson', 4, "Your company shouldn't need you on a Sunday night."],
    ['ad5-hats', 5, "You're not disorganized."],
  ])('%s → ad %d and its hook', (utm, n, hook) => {
    const ad = adForUtmContent(utm);
    expect(ad?.n).toBe(n);
    expect(ad?.hook).toBe(hook);
  });

  it('tolerates case and surrounding spaces from ad platforms', () => {
    expect(adForUtmContent('  AD3-Expert ')?.n).toBe(3);
  });

  it('unknown values keep the hero unchanged', () => {
    for (const v of ['ad6-new', 'bottleneck', 'ad1', 'ad1-bottleneck-v2', '']) expect(adForUtmContent(v), v).toBeNull();
  });

  it('missing values keep the hero unchanged', () => {
    expect(adForUtmContent(undefined)).toBeNull();
    expect(adForUtmContent(null)).toBeNull();
  });

  it('every ad has a distinct utm_content, a hook and descriptive alt text without the hook', () => {
    expect(new Set(AD_CREATIVES.map((a) => a.utmContent)).size).toBe(5);
    for (const ad of AD_CREATIVES) {
      expect(ad.alt.length).toBeGreaterThan(40);
      expect(ad.alt).not.toContain(ad.hook);
    }
  });

  it('builds AVIF and WebP srcsets at 540w and 1080w', () => {
    expect(adImageSources({ n: 2 })).toEqual({
      avif: '/images/ads/ad2-540.avif 540w, /images/ads/ad2-1080.avif 1080w',
      webp: '/images/ads/ad2-540.webp 540w, /images/ads/ad2-1080.webp 1080w',
      fallback: '/images/ads/ad2-1080.webp',
    });
  });
});
