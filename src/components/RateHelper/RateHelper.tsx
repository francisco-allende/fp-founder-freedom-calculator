import { useId, useState } from 'react';
import { WIZARD } from '../../data/copy';
import { formatMoney } from '../../engine/format';
import { effectiveRate } from '../../engine/math';
import { Button } from '../Button/Button';
import styles from './RateHelper.module.css';

/** "Not sure?" mini calculator: yearly target ÷ (weekly hours × 48). */
export function RateHelper({ weeklyHours, onUse }: { weeklyHours: number; onUse: (rate: number) => void }) {
  const id = useId();
  const [target, setTarget] = useState('');
  const a = WIZARD.about;
  const rate = Math.round(effectiveRate(Number(target), weeklyHours));

  return (
    <details className={styles.details}>
      <summary>{a.rateHelperToggle}</summary>
      <div className={styles.body}>
        <label htmlFor={id}>{a.rateHelperTarget}</label>
        <div className={styles.money}>
          <span aria-hidden="true">$</span>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={target}
            placeholder="500000"
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        {rate > 0 && (
          <>
            <p className="num" aria-live="polite">
              {a.rateHelperResult(formatMoney(rate))} ({weeklyHours} h × 48 weeks)
            </p>
            <Button variant="secondary" onClick={() => onUse(rate)}>
              {a.rateHelperUse}
            </Button>
          </>
        )}
      </div>
    </details>
  );
}
