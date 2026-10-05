import { Target } from 'lucide-react';
import { AreaIcon } from '../components/AreaIcon/AreaIcon';
import { REPORT } from '../data/pageCopy';
import { formatHours } from '../engine/format';
import type { Results } from '../engine/math';
import type { Roadmap, RoadmapItem, TaskMapBucket } from '../engine/roadmap';
import type { TaskInput } from '../engine/types';
import { hoursRange, moneyRange } from '../lib/display';
import styles from './sections.module.css';

// Report building blocks shared by /report and the landing page preview.

export function ReportSummary({ results, showYearHours = true }: { results: Results; showYearHours?: boolean }) {
  return (
    <dl className={styles.summary}>
      <div className={styles.lead}>
        <dt>{REPORT.summary.hours}</dt>
        <dd>{hoursRange(results.hours.low, results.hours.realistic)}</dd>
      </div>
      <div>
        <dt>{REPORT.summary.month}</dt>
        <dd>{moneyRange(results.monthly.low, results.monthly.realistic)}</dd>
      </div>
      <div>
        <dt>{REPORT.summary.year}</dt>
        <dd>{moneyRange(results.annual.low, results.annual.realistic)}</dd>
      </div>
      {showYearHours && (
        <div>
          <dt>{REPORT.summary.yearHours}</dt>
          <dd>{hoursRange(results.hoursPerYear.low, results.hoursPerYear.realistic)}</dd>
        </div>
      )}
    </dl>
  );
}

export function TaskMapColumns({ map }: { map: Record<TaskMapBucket, TaskInput[]> }) {
  const columns = [
    [REPORT.map.handOff, map.handOff, styles.colHanded],
    [REPORT.map.approval, map.handOffWithApproval, styles.colApproval],
    [REPORT.map.keep, map.keep, styles.colKeep],
  ] as const;
  return (
    <div className={styles.map}>
      {columns.map(([title, list, cls]) => (
        <div key={title} className={cls}>
          <h3>{title}</h3>
          {list.length === 0 && cls === styles.colKeep ? (
            // Nothing has to stay with the founder: say so as good news, not as an empty list.
            <p className={styles.keepEmpty}>
              <Target size={20} strokeWidth={1.5} aria-hidden="true" />
              <span>{REPORT.map.keepEmpty}</span>
            </p>
          ) : list.length === 0 ? (
            <p className={styles.muted}>{REPORT.map.empty}</p>
          ) : (
            <ul>
              {list.map((t) => (
                <li key={t.id}>
                  <AreaIcon area={t.area} size={16} />
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function Phase({ n, title, items, limit }: { n: number; title: string; items: RoadmapItem[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <li className={styles.phase}>
      {/* Stage marker: numbered dot on the connecting line. */}
      <span className={styles.dot} aria-hidden="true">
        {n}
      </span>
      <div className={styles.phaseBody}>
        <h3>{title}</h3>
        {shown.length === 0 ? (
          <p className={styles.muted}>{REPORT.roadmap.empty}</p>
        ) : (
          <ul>
            {shown.map((i) => (
              <li key={i.taskId || i.name}>
                <p className={styles.itemName}>
                  <span>{i.name}</span>
                  {i.kind === 'task' && <span className={`num ${styles.pill}`}>{REPORT.roadmap.hours(formatHours(i.hours))}</span>}
                </p>
                {i.kind === 'task' && <p className={styles.tip}>{i.tip}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/** The 90-day plan as three numbered phases. `limit` trims each phase (used by the landing preview). */
export function RoadmapTimeline({ roadmap, limit }: { roadmap: Roadmap; limit?: number }) {
  const [p1, p2, p3] = REPORT.roadmap.phases;
  return (
    <ol className={styles.timeline}>
      <Phase n={1} title={p1} items={roadmap.weeks1to2} limit={limit} />
      <Phase n={2} title={p2} items={roadmap.month1} limit={limit} />
      <Phase n={3} title={p3} items={roadmap.months2to3} limit={limit} />
    </ol>
  );
}
