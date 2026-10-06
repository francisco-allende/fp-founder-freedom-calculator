import { AD_IMAGE_SIZE, type AdCreative } from '../../data/ads';
import { adImageSources } from '../../lib/adMatch';
import styles from './AdImage.module.css';

interface Props {
  ad: AdCreative;
  /** CSS sizes hint for picking 540w vs 1080w. */
  sizes: string;
  /** Hero image: eager with high fetch priority. Everything else lazy-loads. */
  priority?: boolean;
  className?: string;
}

/** Responsive ad image (AVIF, then WebP). Width/height + aspect-ratio reserve space: no layout shift. */
export function AdImage({ ad, sizes, priority = false, className }: Props) {
  const src = adImageSources(ad);
  // React 18 does not know `fetchpriority`; lowercase attributes pass straight through to the DOM.
  const fetch = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};
  return (
    <picture className={[styles.picture, className].filter(Boolean).join(' ')}>
      <source type="image/avif" srcSet={src.avif} sizes={sizes} />
      <source type="image/webp" srcSet={src.webp} sizes={sizes} />
      <img
        src={src.fallback}
        alt={ad.alt}
        width={AD_IMAGE_SIZE.width}
        height={AD_IMAGE_SIZE.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        {...fetch}
      />
    </picture>
  );
}
