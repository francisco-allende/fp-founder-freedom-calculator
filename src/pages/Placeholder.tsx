import { Link } from 'react-router-dom';
import { BRAND } from '../data/copy';

/** Temporary page for routes that land in the next build phase. */
export function Placeholder({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main style={{ maxWidth: '46rem', margin: '0 auto', padding: 'var(--space-7) var(--gutter)', display: 'grid', gap: 'var(--space-4)' }}>
      <p>
        <Link to="/">{BRAND.title}</Link>
      </p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
