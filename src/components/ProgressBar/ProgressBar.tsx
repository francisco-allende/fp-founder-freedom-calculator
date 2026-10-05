import styles from './ProgressBar.module.css';

export function ProgressBar({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <nav aria-label="Calculator progress">
      <ol className={styles.list}>
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'current' : 'todo';
          return (
            <li key={label} className={`${styles.item} ${styles[state]}`} aria-current={n === current ? 'step' : undefined}>
              <span className={styles.marker} aria-hidden="true">
                {n}
              </span>
              <span className={styles.label}>
                {label}
                {state === 'done' && <span className="visually-hidden"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
