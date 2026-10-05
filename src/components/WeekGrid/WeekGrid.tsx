import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../hooks/useAnimatedNumber';
import styles from './WeekGrid.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = 12; // 8:00 to 19:00

/**
 * Deterministic "founder week": which hours leak to admin, and the scroll point at which
 * each one is handed off. About 70% of leaks turn emerald by the end; the rest stay amber.
 */
function buildCells() {
  let seed = 42;
  const rand = () => ((seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647);
  const cells: { leak: boolean; t: number }[] = [];
  for (let h = 0; h < HOURS; h++) {
    for (let d = 0; d < 7; d++) {
      const weekend = d >= 5;
      const leakOdds = weekend ? (h < 6 ? 0.35 : 0.1) : h === 0 || h >= 10 ? 0.75 : 0.5;
      const leak = rand() < leakOdds;
      const handed = rand() < 0.7;
      cells.push({ leak, t: handed ? 0.05 + rand() * 0.85 : 2 });
    }
  }
  return cells;
}

const CELLS = buildCells();
const STATIC_PROGRESS = 0.6;

export function WeekGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty('--p', String(STATIC_PROGRESS));
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const distance = Math.max(1, window.innerHeight * 0.9);
      const p = Math.min(1, Math.max(0, window.scrollY / distance));
      el.style.setProperty('--p', p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <figure className={styles.figure}>
      <div ref={ref} className={styles.grid} aria-hidden="true">
        {DAYS.map((d) => (
          <span key={d} className={styles.day}>
            {d}
          </span>
        ))}
        {CELLS.map((c, i) => (
          <span
            key={i}
            className={c.leak ? styles.leak : styles.free}
            style={c.leak ? ({ '--t': c.t, '--i': i } as React.CSSProperties) : undefined}
          />
        ))}
      </div>
      <figcaption className={styles.legend}>
        <span>
          <i className={styles.swatchLeak} aria-hidden="true" /> Hours still on your plate
        </span>
        <span>
          <i className={styles.swatchHanded} aria-hidden="true" /> Hours handed off
        </span>
      </figcaption>
    </figure>
  );
}
