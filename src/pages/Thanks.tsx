import { KeyRound } from 'lucide-react';
import { useMemo } from 'react';
import { AreaIcon } from '../components/AreaIcon/AreaIcon';
import { ButtonLink } from '../components/Button/Button';
import { PageShell } from '../components/PageShell/PageShell';
import { StartOverButton } from '../components/StartOver/StartOverButton';
import { SuccessHeader } from '../components/SuccessHeader/SuccessHeader';
import { BRAND } from '../data/copy';
import { THANKS } from '../data/pageCopy';
import { buildRoadmap } from '../engine/roadmap';
import { readCompletedRun } from '../lib/session';
import { reportFromRun } from '../report/model';
import styles from './Followup.module.css';

/** Not qualified (yet): same layout as /book, report-and-quick-wins message. */
export default function Thanks() {
  const report = useMemo(() => reportFromRun(readCompletedRun()), []);
  const quickWins = useMemo(() => {
    if (!report) return [];
    const areaOf = new Map(report.state.tasks.map((t) => [t.id, t.area]));
    return buildRoadmap(report.state.tasks)
      .weeks1to2.slice(0, 2)
      .map((w) => ({ ...w, area: areaOf.get(w.taskId) }));
  }, [report]);

  return (
    <PageShell>
      <SuccessHeader title={THANKS.heading}>
        {report && <ButtonLink to={report.path}>{THANKS.viewReport}</ButtonLink>}
        <StartOverButton />
      </SuccessHeader>

      <div className={styles.cards}>
        <section className={styles.card} aria-labelledby="thanks-next">
          <h2 id="thanks-next">{THANKS.nextHeading}</h2>
          <p>{THANKS.openReport}</p>
          {quickWins.length > 0 ? (
            <>
              <p>{THANKS.quickWinsIntro}</p>
              <ul className={styles.winCards}>
                {quickWins.map((w) => (
                  <li key={w.taskId || w.name} className={styles.winCard}>
                    <span className={styles.winIcon} aria-hidden="true">
                      {w.kind === 'task' && w.area ? <AreaIcon area={w.area} /> : <KeyRound size={20} strokeWidth={1.5} />}
                    </span>
                    <span>
                      <strong>{w.kind === 'task' ? w.name : w.tip}</strong>
                      {w.kind === 'task' && <span className={styles.tip}>{w.tip}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{THANKS.quickWinsFallback}</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="thanks-support">
          <h2 id="thanks-support">{THANKS.supportHeading}</h2>
          <p>{THANKS.support}</p>
        </section>

        <section className={styles.card} aria-labelledby="thanks-fit">
          <h2 id="thanks-fit">{THANKS.objectionHeading}</h2>
          <p>{THANKS.objection}</p>
          <a href={BRAND.paretoUrl} target="_blank" rel="noopener noreferrer">
            {THANKS.objectionLink}
          </a>
        </section>
      </div>
    </PageShell>
  );
}
