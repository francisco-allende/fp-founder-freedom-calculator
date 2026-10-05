import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { StartOverButton } from '../components/StartOver/StartOverButton';
import { SuccessHeader } from '../components/SuccessHeader/SuccessHeader';
import { GUARANTEES } from '../data/copy';
import { BOOK } from '../data/pageCopy';
import { topTaskNames } from '../engine/math';
import { prefersReducedMotion } from '../hooks/useAnimatedNumber';
import { buildBookingSrc } from '../lib/ghl';
import { runEmbedScript } from '../lib/ghlEmbed';
import { readCompletedRun } from '../lib/session';
import { reportFromRun } from '../report/model';
import styles from './Followup.module.css';

/** Qualified founders: same layout as /thanks, booking-focused message. */
export default function Book() {
  const run = useMemo(() => readCompletedRun(), []);
  const report = useMemo(() => reportFromRun(run), [run]);
  const topTasks = report ? topTaskNames(report.state.tasks) : [];
  const firstName = run?.firstName ?? '';
  const calendarId = import.meta.env.VITE_GHL_CALENDAR_ID;
  const calendarRef = useRef<HTMLElement>(null);

  // Same id shape as HighLevel's own embed code (<calendarId>_<timestamp>).
  const frameId = useMemo(() => `${calendarId}_${Date.now()}`, [calendarId]);

  // form_embed.js auto-resizes /booking iframes it finds when it runs, so run it after mount.
  useEffect(() => {
    if (calendarId) runEmbedScript();
  }, [calendarId]);

  const toCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    calendarRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  };

  return (
    <PageShell>
      <SuccessHeader title={BOOK.heading}>
        <Button onClick={toCalendar}>{BOOK.calendarHeading}</Button>
        <StartOverButton />
      </SuccessHeader>

      <div className={styles.cards}>
        {topTasks.length > 0 && (
          <section className={styles.card} aria-labelledby="book-top">
            <h2 id="book-top">{BOOK.topTasks}</h2>
            <ol className={styles.tasks}>
              {topTasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            {report && <Link to={report.path}>{BOOK.viewReport}</Link>}
          </section>
        )}

        <section className={`${styles.card} ${styles.calendarCard}`} aria-labelledby="book-calendar" ref={calendarRef}>
          <h2 id="book-calendar" tabIndex={-1}>
            {BOOK.calendarHeading}
          </h2>
          {calendarId ? (
            <iframe
              className={styles.calendar}
              src={buildBookingSrc(calendarId, { firstName })}
              title="FP | Francisco Allende | Matching Call"
              id={frameId}
            />
          ) : (
            <p>{BOOK.calendarMissing}</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="book-call">
          <h2 id="book-call">{BOOK.callHeading}</h2>
          <ol className={styles.steps}>
            {BOOK.callSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section className={styles.card} aria-labelledby="book-guarantee">
          <h2 id="book-guarantee">{GUARANTEES.matching.name}</h2>
          <p>{GUARANTEES.matching.text}</p>
        </section>
      </div>
    </PageShell>
  );
}
