import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/Button/Button';
import { Footer } from '../components/Footer/Footer';
import { WeekGrid } from '../components/WeekGrid/WeekGrid';
import { BRAND, PAINS, PROOF } from '../data/copy';
import { LANDING, NAV } from '../data/pageCopy';
import { TESTIMONIALS } from '../data/testimonials';
import styles from './Landing.module.css';

const FEATURED = ['Justin Donald', 'Joe Polish', 'Jon Vroman', 'Bo Royal'];

export default function Landing() {
  const quotes = TESTIMONIALS.filter((t) => FEATURED.includes(t.name));

  return (
    <>
      <header className={styles.hero}>
        <div className={`${styles.inner} ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>{BRAND.title}</h1>
            <p className={styles.subtitle}>{BRAND.subtitle}</p>
            <p>
              <ButtonLink to="/calculator">{NAV.start}</ButtonLink>
            </p>
            <ul className={styles.proof} aria-label="Pareto Talent in numbers">
              <li>{PROOF.foundersServed}</li>
              <li>{PROOF.retention}</li>
              <li>{PROOF.rating}</li>
            </ul>
          </div>
          <WeekGrid />
        </div>
      </header>

      <main>
        <section className={styles.section} aria-labelledby="problem">
          <div className={styles.inner}>
            <h2 id="problem">{LANDING.problem.heading}</h2>
            <ul className={styles.pains}>
              {PAINS.map((p) => (
                <li key={p.pct + p.text}>
                  <span className={styles.pct}>{p.pct}</span> <span>of founders {p.text}</span>
                </li>
              ))}
            </ul>
            <p className={styles.close}>{LANDING.problem.close}</p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.white}`} aria-labelledby="inside">
          <div className={styles.inner}>
            <h2 id="inside">{LANDING.inside.heading}</h2>
            <dl className={styles.inside}>
              {LANDING.inside.items.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="who">
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

        <section className={`${styles.section} ${styles.white}`} aria-labelledby="how">
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
          </div>
        </section>

        <section className={`${styles.section} ${styles.dark}`} aria-labelledby="proof">
          <div className={styles.inner}>
            <h2 id="proof">{LANDING.proof.heading}</h2>
            <ul className={styles.quotes}>
              {quotes.map((t) => (
                <li key={t.name}>
                  <figure>
                    <blockquote>
                      <p>“{t.quote}”</p>
                    </blockquote>
                    <figcaption>
                      <strong>{t.name}</strong>, {t.title}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <ul className={styles.numbers}>
              {[PROOF.foundersServed, PROOF.retention, PROOF.rating, PROOF.selectivity, PROOF.speed, PROOF.network].map(
                (n) => (
                  <li key={n}>{n}</li>
                ),
              )}
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="trust">
          <div className={styles.inner}>
            <h2 id="trust">{LANDING.trust.heading}</h2>
            <p className={styles.lead}>
              {LANDING.trust.text} <Link to="/report#method">{LANDING.trust.link}</Link>.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.white}`} aria-labelledby="faq">
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

        <section className={styles.section} aria-labelledby="final">
          <div className={`${styles.inner} ${styles.final}`}>
            <h2 id="final">{LANDING.final.heading}</h2>
            <p className={styles.lead}>{LANDING.final.text}</p>
            <p>
              <ButtonLink to="/calculator">{NAV.start}</ButtonLink>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
