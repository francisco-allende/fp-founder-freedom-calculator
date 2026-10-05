import { WIZARD } from '../../data/copy';
import { formatHours, formatMoney } from '../../engine/format';
import type { Results } from '../../engine/math';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useDebounced } from '../../hooks/useDebounced';
import styles from './LiveTotal.module.css';

const MAX_CELLS = 60;

/** One cell per task hour: emerald = handed off, amber = still on your plate. */
function HourCells({ total, delegable }: { total: number; delegable: number }) {
  const cells = Math.min(MAX_CELLS, Math.ceil(total));
  const handed = Math.min(cells, Math.round(delegable));
  return (
    <div className={styles.cells} aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={i < handed ? styles.handed : styles.leak} />
      ))}
    </div>
  );
}

export function LiveTotal({ results }: { results: Results }) {
  const { hours, monthly, totalHours } = results;
  const animated = useAnimatedNumber(hours.realistic);
  // Screen readers get one calm update after the slider settles, not one per frame.
  const announced = useDebounced(hours.realistic, 700);

  return (
    <aside className={styles.panel} aria-labelledby="live-total-label">
      <p id="live-total-label" className={styles.label}>
        {WIZARD.live.label}
      </p>
      <p className={styles.figure}>
        <span className={`num ${styles.big}`} aria-hidden="true">
          {formatHours(animated)}
        </span>{' '}
        <span className={styles.unit} aria-hidden="true">
          {WIZARD.live.perWeek}
        </span>
        <span className="visually-hidden" aria-live="polite">
          {formatHours(announced)} {WIZARD.live.perWeek}
        </span>
      </p>
      <div className={styles.details}>
        <p className={`num ${styles.range}`}>{WIZARD.live.range(formatHours(hours.low), formatHours(hours.realistic))}</p>
        <p className={`num ${styles.cost}`}>{WIZARD.live.cost(formatMoney(monthly.realistic))}</p>
        <HourCells total={totalHours} delegable={hours.realistic} />
      </div>
    </aside>
  );
}
