import { Check } from 'lucide-react';
import styles from './ProgressBar.module.css';

interface Props {
  steps: readonly string[];
  current: number;
  /** Completed steps become buttons that go back to them. */
  onStep?: (step: number) => void;
}

export function ProgressBar({ steps, current, onStep }: Props) {
  return (
    <nav aria-label="Calculator progress">
      <ol className={styles.list}>
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'current' : 'todo';
          const marker =
            state === 'done' ? (
              <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{n}</span>
            );
          return (
            <li key={label} className={`${styles.item} ${styles[state]}`} aria-current={n === current ? 'step' : undefined}>
              {state === 'done' && onStep ? (
                <button type="button" className={styles.back} onClick={() => onStep(n)}>
                  <span className={styles.marker}>{marker}</span>
                  <span className={styles.label}>
                    {label}
                    <span className="visually-hidden"> (done, go back)</span>
                  </span>
                </button>
              ) : (
                <>
                  <span className={styles.marker}>{marker}</span>
                  <span className={styles.label}>{label}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
