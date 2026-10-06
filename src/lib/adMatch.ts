import { AD_CREATIVES, type AdCreative } from '../data/ads';

// Ad-to-landing message match: the first-touch utm_content picks the hero's image and hook.
// Pure: no storage or URL access here (see firstTouchUtmContent in the landing page).

const BY_UTM = new Map(AD_CREATIVES.map((ad) => [ad.utmContent, ad]));

/** The ad a visitor came from, or null for unknown/missing values (the hero then stays unchanged). */
export function adForUtmContent(utmContent: string | null | undefined): AdCreative | null {
  if (typeof utmContent !== 'string') return null;
  return BY_UTM.get(utmContent.trim().toLowerCase()) ?? null;
}

/** Responsive sources for an ad image: AVIF and WebP at 540w and 1080w. */
export function adImageSources(ad: Pick<AdCreative, 'n'>) {
  const base = `/images/ads/ad${ad.n}`;
  const set = (ext: 'avif' | 'webp') => `${base}-540.${ext} 540w, ${base}-1080.${ext} 1080w`;
  return { avif: set('avif'), webp: set('webp'), fallback: `${base}-1080.webp` };
}
