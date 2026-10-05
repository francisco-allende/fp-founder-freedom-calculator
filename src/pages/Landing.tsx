import { CalendarSearch, FileDown, FlaskConical, Gauge, Map, Route, Wallet, type LucideIcon } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AreaIcon } from '../components/AreaIcon/AreaIcon';
import { ButtonLink } from '../components/Button/Button';
import { Footer } from '../components/Footer/Footer';
import { HeroCalculator } from '../components/HeroCalculator/HeroCalculator';
import { BRAND, PAINS, PROOF, PROOF_STATS } from '../data/copy';
import { LANDING } from '../data/pageCopy';
import { TESTIMONIALS } from '../data/testimonials';
import { LIBRARY_AREAS } from '../engine/types';
import { useNearViewport } from '../hooks/useNearViewport';
import styles from './Landing.module.css';

// Recharts only loads when the preview section gets close to the viewport.
const ReportPreview = lazy(() => import('../report/ReportPreview'));

const FEATURED = ['Justin Donald', 'Joe Polish', 'Jon Vroman', 'Bo Royal'];
const INSIDE_ICONS: LucideIcon[] = [Gauge, Wallet, Map, Route, CalendarSearch, FileDown];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function Landing() {
  const quotes = TESTIMONIALS.filter((t) => FEATURED.includes(t.name));
  const [previewRef, previewNear] = useNearViewport<HTMLDivElement>();

  return (
    <>
      <header className={`${styles.band} ${styles.forest} ${styles.hero}`}>
        <div className={`${styles.inner} ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>{BRAND.title}</h1>
            <p className={styles.subtitle}>{BRAND.subtitle}</p>
            <ul className={styles.proof} aria-label="Pareto Talent in numbers">
              <li>{PROOF.foundersServed}</li>
              <li>{PROOF.retention}</li>
              <li>{PROOF.rating}</li>
            </ul>
          </div>
          <HeroCalculator />
        </div>
      </header>

      <main>
        <section className={`${styles.band} ${styles.mist}`} aria-labelledby="problem">
          <div className={styles.inner}>
            <h2 id="problem">{LANDING.problem.heading}</h2>
            <ul className={styles.pains}>
              {PAINS.map((p) => (
                <li key={p.pct + p.text}>
                  <span className={styles.pct}>{p.pct}</span> <span>of founders {p.text}</span>
                </li>
              ))}
            </ul>
            <p className={styles.source}>{LANDING.problem.source}</p>
            <p className={styles.close}>{LANDING.problem.close}</p>
          </div>
        </section>

        <section className={`${styles.band} ${styles.white}`} aria-labelledby="inside">
          <div className={styles.inner}>
            <h2 id="inside">{LANDING.inside.heading}</h2>
            <div className={styles.insideGrid}>
              <div ref={previewRef} className={styles.previewSlot}>
                {previewNear && (
                  <Suspense fallback={<div className={styles.previewPlaceholder} />}>
                    <ReportPreview />
                  </Suspense>
                )}
                {!previewNear && <div className={styles.previewPlaceholder} />}
              </div>
              <ul className={styles.inside}>
                {LANDING.inside.items.map((item, i) => {
                  const Icon = INSIDE_ICONS[i]!;
                  return (
                    <li key={item.title}>
                      <Icon className={styles.insideIcon} size={24} strokeWidth={1.5} aria-hidden="true" />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className={`${styles.band} ${styles.mist}`} aria-labelledby="who">
          <div className={styles.inner}>
            <h2 id="who">{LANDING.who.heading}</h2>
            <p className={styles.lead}>{LANDING.who.intro}</p>
            <ul className={styles.personas}>
              {LANDING.who.personas.map((p) => (
                <li key={p.title}>
                  <h3>{p.title}</h3>
                  <blockquote className={styles.personaQuote}>
                    <p>“{p.quote}”</p>
                  </blockquote>
                  <p className={styles.personaWho}>{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.band} ${styles.white}`} aria-labelledby="how">
          <div className={styles.inner}>
            <h2 id="how">{LANDING.how.heading}</h2>
            <ol className={styles.steps}>
              {LANDING.how.steps.map((s, i) => (
                <li key={s.title}>
                  <span className={styles.stepNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <div className={styles.areas}>
              <p className={styles.areasLabel}>{LANDING.how.areasLabel}</p>
              <ul>
                {LIBRARY_AREAS.map((a) => (
                  <li key={a}>
                    <AreaIcon area={a} size={18} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={`${styles.band} ${styles.forest}`} aria-labelledby="trust">
          <div className={`${styles.inner} ${styles.trust}`}>
            <h2 id="trust">{LANDING.trust.heading}</h2>
            <p className={styles.badge}>
              <FlaskConical size={18} strokeWidth={1.5} aria-hidden="true" />
              {LANDING.trust.badge(__TEST_COUNT__)}
            </p>
            <p className={styles.lead}>{LANDING.trust.text}</p>
            <p>
              <Link to="/report#method" className={styles.onDarkLink}>
                {LANDING.trust.link}
              </Link>
            </p>
          </div>
        </section>

        <section className={`${styles.band} ${styles.mist}`} aria-labelledby="proof">
          <div className={styles.inner}>
            <h2 id="proof">{LANDING.proof.heading}</h2>
            <ul className={styles.quotes}>
              {quotes.map((t) => (
                <li key={t.name}>
                  <figure className={styles.quoteCard}>
                    <blockquote>
                      <p>“{t.quote}”</p>
                    </blockquote>
                    <figcaption>
                      <span className={styles.monogram} aria-hidden="true">
                        {initials(t.name)}
                      </span>
                      <span>
                        <strong>{t.name}</strong>
                        <span className={styles.company}>{t.title}</span>
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <dl className={styles.stats}>
              {PROOF_STATS.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={`${styles.band} ${styles.white}`} aria-labelledby="faq">
          <div className={styles.inner}>
            <h2 id="faq">{LANDING.faq.heading}</h2>
            <div className={styles.faq}>
              {LANDING.faq.items.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.band} ${styles.forest}`} aria-labelledby="final">
          <div className={`${styles.inner} ${styles.final}`}>
            <h2 id="final">{LANDING.final.heading}</h2>
            <p className={styles.lead}>{LANDING.final.text}</p>
            <p>
              <ButtonLink to="/calculator">{LANDING.hero.cta}</ButtonLink>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
