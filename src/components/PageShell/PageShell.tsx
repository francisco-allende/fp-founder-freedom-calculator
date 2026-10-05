import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../data/copy';
import { Footer } from '../Footer/Footer';
import styles from './PageShell.module.css';

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand}>
            {BRAND.title}
          </Link>
        </div>
      </header>
      {/* Same 72rem container and left edge as the header; the reading column is narrower but left-aligned. */}
      <main className={styles.inner}>
        <div className={`${styles.main} ${wide ? styles.wide : ''}`}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
