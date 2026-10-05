import type { ReactNode } from 'react';
import styles from './SuccessHeader.module.css';

/**
 * Shared top of /book and /thanks: a check that draws itself once, the title, then the actions
 * (primary first, "Start a new calculation" second). Messages stay page-specific.
 */
export function SuccessHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.header}>
      <svg className={styles.check} viewBox="0 0 52 52" width="56" height="56" aria-hidden="true" focusable="false">
        <circle className={styles.ring} cx="26" cy="26" r="24" />
        <path className={styles.tick} d="M15 27l7 7 15-16" />
      </svg>
      <h1>{title}</h1>
      <div className={styles.actions}>{children}</div>
    </section>
  );
}
