import { useMemo } from 'react';
import { ButtonLink } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { BRAND } from '../data/copy';
import { THANKS } from '../data/pageCopy';
import { decodeReport } from '../engine/reportState';
import { buildRoadmap } from '../engine/roadmap';
import { isStoredQualification, readJSON, STORAGE_KEYS } from '../lib/storage';
import { reportPath } from '../report/model';
import styles from './Followup.module.css';

export default function Thanks() {
  const stored = useMemo(() => readJSON(STORAGE_KEYS.qualification, isStoredQualification), []);
  const path = stored ? reportPath(stored.reportUrl) : null;
  const quickWins = useMemo(() => {
    const d = path ? new URLSearchParams(path.split('?')[1]).get('d') : null;
    const state = decodeReport(d);
    return state ? buildRoadmap(state.tasks).weeks1to2.slice(0, 2) : [];
  }, [path]);

  return (
    <PageShell>
      <section className={styles.section}>
        <h1>{THANKS.heading}</h1>
        {path && (
          <p>
            <ButtonLink to={path}>{THANKS.viewReport}</ButtonLink>
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="thanks-next">
        <h2 id="thanks-next">{THANKS.nextHeading}</h2>
        <ol className={styles.steps}>
          <li>{THANKS.openReport}</li>
          <li>
            {quickWins.length > 0 ? (
              <>
                {THANKS.quickWinsIntro}
                <ul className={styles.wins}>
                  {quickWins.map((w) => (
                    <li key={w.taskId || w.name}>
                      <strong>{w.kind === 'task' ? w.name : w.tip}</strong>
                      {w.kind === 'task' && <span className={styles.tip}>{w.tip}</span>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              THANKS.quickWinsFallback
            )}
          </li>
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="thanks-support">
        <h2 id="thanks-support">{THANKS.supportHeading}</h2>
        <p>{THANKS.support}</p>
      </section>

      <section className={styles.section} aria-labelledby="thanks-fit">
        <h2 id="thanks-fit">{THANKS.objectionHeading}</h2>
        <p>{THANKS.objection}</p>
        <p>
          <a href={BRAND.paretoUrl} target="_blank" rel="noopener noreferrer">
            {THANKS.objectionLink}
          </a>
        </p>
      </section>
    </PageShell>
  );
}
