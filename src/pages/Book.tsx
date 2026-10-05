import { useEffect, useMemo } from 'react';
import { ButtonLink } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { GUARANTEES } from '../data/copy';
import { BOOK } from '../data/pageCopy';
import { StartOverButton } from '../components/StartOver/StartOverButton';
import { buildBookingSrc } from '../lib/ghl';
import { runEmbedScript } from '../lib/ghlEmbed';
import { readCompletedRun } from '../lib/session';
import { reportFromRun } from '../report/model';
import { topTaskNames } from '../engine/math';
import styles from './Followup.module.css';

export default function Book() {
  const run = useMemo(() => readCompletedRun(), []);
  const report = useMemo(() => reportFromRun(run), [run]);
  const topTasks = report ? topTaskNames(report.state.tasks) : [];
  const firstName = run?.firstName ?? '';
  const calendarId = import.meta.env.VITE_GHL_CALENDAR_ID;

  // Same id shape as HighLevel's own embed code (<calendarId>_<timestamp>).
  const frameId = useMemo(() => `${calendarId}_${Date.now()}`, [calendarId]);

  // form_embed.js auto-resizes /booking iframes it finds when it runs, so run it after mount.
  useEffect(() => {
    if (calendarId) runEmbedScript();
  }, [calendarId]);

  return (
    <PageShell>
      <section className={styles.section}>
        <h1>{BOOK.heading}</h1>
        {topTasks.length > 0 && (
          <div>
            <h2 className={styles.h2}>{BOOK.topTasks}</h2>
            <ol className={styles.tasks}>
              {topTasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="book-calendar">
        <h2 id="book-calendar">{BOOK.calendarHeading}</h2>
        {calendarId ? (
          <iframe
            className={styles.calendar}
            src={buildBookingSrc(calendarId, { firstName })}
            title="FP | Francisco Allende | Matching Call"
            id={frameId}
          />
        ) : (
          <p className={styles.note}>{BOOK.calendarMissing}</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="book-call">
        <h2 id="book-call">{BOOK.callHeading}</h2>
        <ol className={styles.steps}>
          {BOOK.callSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <div className={styles.guarantee}>
          <h3>{GUARANTEES.matching.name}</h3>
          <p>{GUARANTEES.matching.text}</p>
        </div>
      </section>

      <p className={styles.actions}>
        {report && (
          <ButtonLink to={report.path} variant="secondary">
            {BOOK.viewReport}
          </ButtonLink>
        )}
        <StartOverButton />
      </p>
    </PageShell>
  );
}
