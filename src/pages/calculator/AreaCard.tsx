import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { AreaIcon } from '../../components/AreaIcon/AreaIcon';
import { WIZARD } from '../../data/copy';
import { formatHours } from '../../engine/format';
import type { Area } from '../../engine/types';
import styles from './AreaCard.module.css';

interface Props {
  area: Area;
  open: boolean;
  onToggle: () => void;
  /** Delegable hours/week of the selected tasks in this area. */
  subtotal: number;
  selected: number;
  total: number;
  children: ReactNode;
}

/** Collapsible task area: icon, name, live subtotal and task count in the header. */
export function AreaCard({ area, open, onToggle, subtotal, selected, total, children }: Props) {
  const id = useId();
  return (
    <section className={`${styles.card} ${open ? styles.open : ''}`} aria-labelledby={`${id}-h`}>
      <h2 className={styles.heading} id={`${id}-h`}>
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>
          <AreaIcon area={area} size={22} />
          <span className={styles.titles}>
            <span className={styles.area}>{area}</span>
            <span className={`num ${styles.meta}`}>
              {WIZARD.tasks.areaSubtotal(formatHours(subtotal))} · {WIZARD.tasks.areaCount(selected, total)}
            </span>
          </span>
          <ChevronDown className={styles.chevron} size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </h2>
      <div id={`${id}-panel`} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
