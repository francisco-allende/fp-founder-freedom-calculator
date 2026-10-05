import { Link } from 'react-router-dom';
import { BRAND } from '../../data/copy';
import { NAV } from '../../data/pageCopy';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>
          {BRAND.footer} ·{' '}
          <a href={BRAND.paretoUrl} target="_blank" rel="noopener noreferrer">
            paretotalent.com
          </a>
        </p>
        <p>
          <Link to="/privacy">{NAV.privacy}</Link>
        </p>
      </div>
    </footer>
  );
}
