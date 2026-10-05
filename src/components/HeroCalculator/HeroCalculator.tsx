import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANDING } from '../../data/pageCopy';
import { TASKS_BY_ID } from '../../data/tasks';
import { DEFAULT_RATE } from '../../engine/constants';
import { formatHours } from '../../engine/format';
import { monthlyCost } from '../../engine/math';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useDebounced } from '../../hooks/useDebounced';
import { moneyCompact } from '../../lib/display';
import { HOURS_STEP, MAX_TASK_HOURS, seedNewRun } from '../../state/wizard';
import { Button } from '../Button/Button';
import styles from './HeroCalculator.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ROWS = 10; // 10 × 15 min per day = room for 12.5 h a week
const SLOTS_PER_HOUR = 4;
const EMAIL = TASKS_BY_ID.get('inbox')!; // same default share as the calculator (70%)
const DEFAULT_HOURS = 5;

/**
 * Landing hero: one slider fills the week grid live. The page's single orchestrated motion
 * (design rule 6a): it only moves when the visitor moves the slider.
 */
export function HeroCalculator() {
  const id = useId();
  const navigate = useNavigate();
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const h = LANDING.hero;

  const handed = hours * EMAIL.defaultPct;
  const animated = useAnimatedNumber(handed);
  const announced = useDebounced(handed, 600);

  const emailCells = Math.round(hours * SLOTS_PER_HOUR);
  const handedCells = Math.round(emailCells * EMAIL.defaultPct);

  const sentence = (v: number) => h.result(`${formatHours(v)} h`, moneyCompact(monthlyCost(v, DEFAULT_RATE)));

  return (
    <div className={styles.card}>
      <div className={styles.control}>
        <label htmlFor={id} className={styles.label}>
          {h.slider}
        </label>
        <span className={styles.value} aria-hidden="true">
          {formatHours(hours)} h
        </span>
        <input
          id={id}
          type="range"
          min={0}
          max={MAX_TASK_HOURS}
          step={HOURS_STEP * 2}
          value={hours}
          style={{ ['--pct' as string]: `${(hours / MAX_TASK_HOURS) * 100}%` }}
          aria-valuetext={`${formatHours(hours)} hours a week`}
          onChange={(e) => setHours(Number(e.target.value))}
        />
      </div>

      <div className={styles.grid} aria-hidden="true">
        {DAYS.map((d) => (
          <span key={d} className={styles.day}>
            {d}
          </span>
        ))}
        {Array.from({ length: ROWS * DAYS.length }, (_, k) => (
          // Fill order goes across the week first, so email spreads over every day.
          <span key={k} className={k < handedCells ? styles.handed : k < emailCells ? styles.leak : styles.free} />
        ))}
      </div>

      <ul className={styles.legend} aria-hidden="true">
        <li>
          <i className={styles.swatchLeak} /> {h.onPlate}
        </li>
        <li>
          <i className={styles.swatchHanded} /> {h.handedOff}
        </li>
      </ul>
      <p className={styles.caption}>{h.legend}</p>

      <p className={styles.result}>
        <span aria-hidden="true">{sentence(animated)}</span>
        <span className="visually-hidden" aria-live="polite">
          {sentence(announced)}
        </span>
      </p>
      <p className={styles.assumption}>{h.assumption}</p>

      <Button
        onClick={() => {
          seedNewRun(hours);
          navigate('/calculator');
        }}
      >
        {h.cta}
      </Button>
    </div>
  );
}
