import { useEffect, useMemo } from 'react';
import { ButtonLink } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { GUARANTEES } from '../data/copy';
import { BOOK } from '../data/pageCopy';
import { decodeReport } from '../engine/reportState';
import { buildBookingSrc } from '../lib/ghl';
import { runEmbedScript } from '../lib/ghlEmbed';
import { isStoredQualification, readJSON, STORAGE_KEYS } from '../lib/storage';
import { reportPath } from '../report/model';
import styles from './Followup.module.css';

export default function Book() {
  const stored = useMemo(() => readJSON(STORAGE_KEYS.qualification, isStoredQualification), []);
  const path = stored ? reportPath(stored.reportUrl) : null;
  const firstName = useMemo(() => {
    const d = path ? new URLSearchParams(path.split('?')[1]).get('d') : null;
    return decodeReport(d)?.firstName ?? '';
  }, [path]);
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
        {stored && stored.topTasks.length > 0 && (
          <div>
            <h2 className={styles.h2}>{BOOK.topTasks}</h2>
            <ol className={styles.tasks}>
              {stored.topTasks.map((t) => (
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

      {path && (
        <p>
          <ButtonLink to={path} variant="secondary">
            {BOOK.viewReport}
          </ButtonLink>
        </p>
      )}
    </PageShell>
  );
}
