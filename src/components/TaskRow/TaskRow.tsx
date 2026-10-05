import { useId } from 'react';
import { WIZARD } from '../../data/copy';
import { formatHours } from '../../engine/format';
import { HOURS_STEP, MAX_TASK_HOURS } from '../../state/wizard';
import styles from './TaskRow.module.css';

interface Props {
  name: string;
  hours: number;
  pct: number;
  needsApproval?: boolean;
  /** Library tasks can be switched off; custom tasks are removed instead. */
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  onHours: (hours: number) => void;
  onPct: (pct: number) => void;
}

export function TaskRow({ name, hours, pct, needsApproval, selected = true, onToggle, onRemove, onHours, onPct }: Props) {
  const id = useId();
  const t = WIZARD.tasks;

  return (
    <li className={`${styles.row} ${selected ? '' : styles.off}`}>
      <div className={styles.head}>
        {onToggle ? (
          <label className={styles.toggle}>
            <input type="checkbox" checked={selected} onChange={onToggle} aria-label={t.include(name)} />
            <span className={styles.name}>{name}</span>
          </label>
        ) : (
          <span className={styles.name}>{name}</span>
        )}
        {needsApproval && <span className={styles.badge}>{t.approval}</span>}
        {onRemove && (
          <button type="button" className={styles.remove} onClick={onRemove} aria-label={t.remove(name)}>
            Remove
          </button>
        )}
      </div>

      {selected && (
        <div className={styles.sliders}>
          <div className={styles.slider}>
            <label htmlFor={`${id}-h`}>{t.hours}</label>
            <span className={`num ${styles.value}`} aria-hidden="true">
              {formatHours(hours)} h
            </span>
            <input
              id={`${id}-h`}
              type="range"
              min={0}
              max={MAX_TASK_HOURS}
              step={HOURS_STEP}
              value={hours}
              aria-valuetext={`${formatHours(hours)} hours per week`}
              onChange={(e) => onHours(Number(e.target.value))}
            />
          </div>
          <div className={styles.slider}>
            <label htmlFor={`${id}-p`}>{t.pct}</label>
            <span className={`num ${styles.value}`} aria-hidden="true">
              {pct}%
            </span>
            <input
              id={`${id}-p`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              aria-valuetext={`${pct} percent`}
              onChange={(e) => onPct(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </li>
  );
}
