import { WIZARD } from '../../data/copy';
import { WEEKS_PER_MONTH } from '../../engine/constants';
import { formatHours } from '../../engine/format';
import { nonNeg, type Results } from '../../engine/math';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useDebounced } from '../../hooks/useDebounced';
import { hoursWhole, moneyCompact } from '../../lib/display';
import styles from './LiveTotal.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WORKDAY_HOURS = 8;

/** Split the founder's week into whole-hour blocks: handed off, staying with them, and free. */
export function weekBlocks(weeklyHours: number, delegable: number, totalTaskHours: number) {
  const total = Math.max(0, Math.round(weeklyHours));
  const handed = Math.min(total, Math.round(delegable));
  const kept = Math.min(total - handed, Math.max(0, Math.round(totalTaskHours) - handed));
  return { total, handed, kept, free: total - handed - kept };
}

/** Display-only: monthly hand-off hours as 8-hour workdays, whole number. */
export function workdaysBack(delegablePerWeek: number): number {
  return Math.round((nonNeg(delegablePerWeek) * WEEKS_PER_MONTH) / WORKDAY_HOURS);
}

/** Mon–Fri columns of hour blocks. Filled across the week so every day shows the split. */
function YourWeek({ weeklyHours, delegable, totalHours }: { weeklyHours: number; delegable: number; totalHours: number }) {
  const { total, handed, kept } = weekBlocks(weeklyHours, delegable, totalHours);
  const kind = (k: number) => (k < handed ? styles.handed : k < handed + kept ? styles.kept : styles.free);
  const perDay = Math.ceil(total / DAYS.length);

  return (
    <figure className={styles.week}>
      <figcaption className={styles.weekHeading}>{WIZARD.live.weekHeading}</figcaption>
      <div className={styles.columns} aria-hidden="true">
        {DAYS.map((day, d) => (
          <div key={day} className={styles.column}>
            <span className={styles.day}>{day}</span>
            {Array.from({ length: perDay }, (_, row) => row * DAYS.length + d)
              .filter((k) => k < total)
              .map((k) => (
                <span key={k} className={kind(k)} />
              ))}
          </div>
        ))}
      </div>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <i className={styles.handed} /> {WIZARD.live.handed}
        </li>
        <li>
          <i className={styles.kept} /> {WIZARD.live.kept}
        </li>
      </ul>
      <p className={styles.weekCaption}>{WIZARD.live.weekCaption(total)}</p>
    </figure>
  );
}

export function LiveTotal({ results, weeklyHours }: { results: Results; weeklyHours: number }) {
  const { hours, monthly, totalHours } = results;
  // Short count-up only when the user changes something (first render shows the value as is).
  const animated = useAnimatedNumber(hours.realistic, 300);
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
        <p className={`num ${styles.range}`}>{WIZARD.live.range(hoursWhole(hours.low), hoursWhole(hours.realistic))}</p>
        <p className={`num ${styles.cost}`}>{WIZARD.live.cost(moneyCompact(monthly.realistic))}</p>
        <p className={`num ${styles.workdays}`}>{WIZARD.live.workdays(workdaysBack(hours.realistic))}</p>
        <YourWeek weeklyHours={weeklyHours} delegable={hours.realistic} totalHours={totalHours} />
      </div>
    </aside>
  );
}
