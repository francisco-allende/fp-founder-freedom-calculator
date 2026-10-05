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
      <main className={`${styles.inner} ${styles.main} ${wide ? styles.wide : ''}`}>{children}</main>
      <Footer />
    </>
  );
}
