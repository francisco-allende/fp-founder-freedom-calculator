// The 5 Meta ads (images: public/images/ads, built from src/assets by `npm run images`).
// Images carry no text; every hook lives here, in HTML.

export interface AdCreative {
  /** 1–5, matches the image file names (ad1-540.webp…). */
  n: 1 | 2 | 3 | 4 | 5;
  /** First-touch utm_content value each ad is tagged with (SPEC §9). */
  utmContent: string;
  persona: string;
  hook: string;
  /** Descriptive alt text: what is in the picture, no marketing copy. */
  alt: string;
}

export const AD_CREATIVES: readonly AdCreative[] = [
  {
    n: 1,
    utmContent: 'ad1-bottleneck',
    persona: 'The Human Bottleneck',
    hook: "You're the bottleneck in your own company.",
    alt: "Overhead view of a founder's hands on a green desk, with threads running from the fingers to papers, a phone, a calendar and keys.",
  },
  {
    n: 2,
    utmContent: 'ad2-burned',
    persona: 'The Burned Delegator',
    hook: "You didn't fail at delegating.",
    alt: "A founder's hands passing a clear checklist card to another pair of hands, with crumpled sticky notes beside them.",
  },
  {
    n: 3,
    utmContent: 'ad3-expert',
    persona: 'The Expert Turned Admin',
    hook: "You didn't start your firm to answer email.",
    alt: "A founder's hands sorting envelopes and invoices piled on top of an architectural blueprint and drafting tools.",
  },
  {
    n: 4,
    utmContent: 'ad4-alwayson',
    persona: 'The Always-On Founder',
    hook: "Your company shouldn't need you on a Sunday night.",
    alt: "A founder writing at a desk at night under a single lamp, with sunglasses resting on a closed book.",
  },
  {
    n: 5,
    utmContent: 'ad5-hats',
    persona: 'The Hat-Juggler',
    hook: "You're not disorganized.",
    alt: "A founder holding a fedora and a firefighter helmet, surrounded by a hard hat, a cap and a headset.",
  },
];

/** Intrinsic size of every ad image, for width/height attributes (no layout shift). */
export const AD_IMAGE_SIZE = { width: 1080, height: 1350 } as const;
