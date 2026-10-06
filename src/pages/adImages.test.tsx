import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AD_CREATIVES } from '../data/ads';
import { STORAGE_KEYS, writeJSON } from '../lib/storage';
import { firstTouchUtm } from '../lib/utm';
import Landing from './Landing';

const landing = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Landing />
    </MemoryRouter>,
  );
const hero = () => screen.getByRole('banner');

describe('ad-to-landing message match in the hero', () => {
  it('no utm_content: the hero stays unchanged (no image, no hook)', () => {
    landing();
    expect(within(hero()).queryByRole('img')).toBeNull();
    expect(within(hero()).getByRole('heading', { level: 1, name: 'The Founder Freedom Calculator' })).toBeInTheDocument();
  });

  it('unknown utm_content: unchanged', () => {
    landing('/?utm_content=ad9-something');
    expect(within(hero()).queryByRole('img')).toBeNull();
  });

  it('stored first-touch ad3-expert: that ad’s image (eager, high priority) and hook', () => {
    writeJSON(STORAGE_KEYS.utm, { utm_source: 'meta', utm_content: 'ad3-expert' });
    landing();
    const img = within(hero()).getByRole('img');
    expect(img).toHaveAttribute('alt', AD_CREATIVES[2]!.alt);
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(within(hero()).getByText("You didn't start your firm to answer email.")).toBeInTheDocument();
    expect(within(hero()).getByRole('heading', { level: 1 })).toHaveTextContent('The Founder Freedom Calculator');
  });

  it('works on the very first render from the URL, before UTMs are stored', () => {
    landing('/?utm_source=meta&utm_content=ad5-hats');
    expect(within(hero()).getByText("You're not disorganized.")).toBeInTheDocument();
  });

  it('first touch wins over a later ad', () => {
    writeJSON(STORAGE_KEYS.utm, { utm_content: 'ad1-bottleneck' });
    landing('/?utm_content=ad4-alwayson');
    expect(within(hero()).getByText("You're the bottleneck in your own company.")).toBeInTheDocument();
    expect(firstTouchUtm('?utm_content=ad4-alwayson').utm_content).toBe('ad1-bottleneck');
  });
});

describe('"Who it\'s for" persona cards', () => {
  it('one card per ad, in order, with persona, hook and a lazy, sized image', () => {
    landing();
    const region = screen.getByRole('region', { name: 'Five founders this calculator was built for' });
    const cards = within(region).getAllByRole('listitem');
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'The Human Bottleneck',
      'The Burned Delegator',
      'The Expert Turned Admin',
      'The Always-On Founder',
      'The Hat-Juggler',
    ]);
    cards.forEach((card, i) => {
      const ad = AD_CREATIVES[i]!;
      expect(within(card).getByText(ad.hook)).toBeInTheDocument();
      const img = within(card).getByRole('img');
      expect(img).toHaveAttribute('alt', ad.alt);
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('width', '1080');
      expect(img).toHaveAttribute('height', '1350');
      const sources = card.querySelectorAll('source');
      expect([...sources].map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
      expect(sources[0]!.getAttribute('srcset')).toBe(`/images/ads/ad${ad.n}-540.avif 540w, /images/ads/ad${ad.n}-1080.avif 1080w`);
    });
  });

  it('the existing section copy stays (intro and client quotes)', () => {
    landing();
    expect(screen.getByText(/become the bottleneck in their own business/)).toBeInTheDocument();
    expect(screen.getByText(/I don't have time to train someone right now/)).toBeInTheDocument();
  });
});
