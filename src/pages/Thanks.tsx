import { useMemo } from 'react';
import { ButtonLink } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { BRAND } from '../data/copy';
import { THANKS } from '../data/pageCopy';
import { StartOverButton } from '../components/StartOver/StartOverButton';
import { buildRoadmap } from '../engine/roadmap';
import { readCompletedRun } from '../lib/session';
import { reportFromRun } from '../report/model';
import styles from './Followup.module.css';

export default function Thanks() {
  const report = useMemo(() => reportFromRun(readCompletedRun()), []);
  const quickWins = useMemo(() => (report ? buildRoadmap(report.state.tasks).weeks1to2.slice(0, 2) : []), [report]);

  return (
    <PageShell>
      <section className={styles.section}>
        <h1>{THANKS.heading}</h1>
        <p className={styles.actions}>
          {report && <ButtonLink to={report.path}>{THANKS.viewReport}</ButtonLink>}
          <StartOverButton />
        </p>
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
