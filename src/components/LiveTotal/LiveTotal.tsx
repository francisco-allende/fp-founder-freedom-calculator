import { ChevronUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { WIZARD } from '../../data/copy';
import { WEEKS_PER_MONTH } from '../../engine/constants';
import { formatHours } from '../../engine/format';
import { nonNeg, type Results } from '../../engine/math';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useDebounced } from '../../hooks/useDebounced';
import { hoursWhole, moneyCompact } from '../../lib/display';
import { Button } from '../Button/Button';
import styles from './LiveTotal.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WORKDAY_HOURS = 8;

/** Split the founder's week into whole-hour blocks: handed off, staying with them, and free. */
export function weekBlocks(weeklyHours: number, delegable: number, totalTaskHours: number) {
  const total = Math.max(0, Math.round(weeklyHours));
  const handed = Math.min(total, Math.round(delegable));
  const kept = Math.min(total - handed, Math.max(0, Math.round(totalTaskHours) - handed));
  return { total, handed, kept, free: total - handed - kept };
}

/** Display-only: monthly hand-off hours as 8-hour workdays, whole number. */
export function workdaysBack(delegablePerWeek: number): number {
  return Math.round((nonNeg(delegablePerWeek) * WEEKS_PER_MONTH) / WORKDAY_HOURS);
}

/** Mon–Fri columns of hour blocks. Filled across the week so every day shows the split. */
function YourWeek({ weeklyHours, delegable, totalHours }: { weeklyHours: number; delegable: number; totalHours: number }) {
  const { total, handed, kept } = weekBlocks(weeklyHours, delegable, totalHours);
  const kind = (k: number) => (k < handed ? styles.handed : k < handed + kept ? styles.kept : styles.free);
  const perDay = Math.ceil(total / DAYS.length);

  return (
    <figure className={styles.week}>
      <figcaption className={styles.weekHeading}>{WIZARD.live.weekHeading}</figcaption>
      <div className={styles.columns} aria-hidden="true">
        {DAYS.map((day, d) => (
          <div key={day} className={styles.column}>
            <span className={styles.day}>{day}</span>
            {Array.from({ length: perDay }, (_, row) => row * DAYS.length + d)
              .filter((k) => k < total)
              .map((k) => (
                <span key={k} className={kind(k)} />
              ))}
          </div>
        ))}
      </div>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <i className={styles.handed} /> {WIZARD.live.handed}
        </li>
        <li>
          <i className={styles.kept} /> {WIZARD.live.kept}
        </li>
      </ul>
      <p className={styles.weekCaption}>{WIZARD.live.weekCaption(total)}</p>
    </figure>
  );
}

/** Range, cost, workdays and the week grid: shared by the desktop card and the mobile sheet. */
function SummaryDetails({ results, weeklyHours }: { results: Results; weeklyHours: number }) {
  const { hours, monthly, totalHours } = results;
  return (
    <div className={styles.details}>
      <p className={`num ${styles.range}`}>{WIZARD.live.range(hoursWhole(hours.low), hoursWhole(hours.realistic))}</p>
      <p className={`num ${styles.cost}`}>{WIZARD.live.cost(moneyCompact(monthly.realistic))}</p>
      <p className={`num ${styles.workdays}`}>{WIZARD.live.workdays(workdaysBack(hours.realistic))}</p>
      <YourWeek weeklyHours={weeklyHours} delegable={hours.realistic} totalHours={totalHours} />
    </div>
  );
}

/** Bottom sheet with the full summary card. Escape or the backdrop closes it; focus returns to the bar. */
function SummarySheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.sheetLayer}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="summary-sheet-title">
        <div className={styles.sheetHead}>
          <h2 id="summary-sheet-title" className={styles.sheetTitle}>
            {WIZARD.live.sheetTitle}
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label={WIZARD.live.sheetClose}>
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface Props {
  results: Results;
  weeklyHours: number;
  /** The step's next action, shown inside the mobile bar (one sticky element). */
  action?: { label: string; onClick: () => void };
}

export function LiveTotal({ results, weeklyHours, action }: Props) {
  const { hours } = results;
  // Short count-up only when the user changes something (first render shows the value as is).
  const animated = useAnimatedNumber(hours.realistic, 300);
  // Screen readers get one calm update after the slider settles, not one per frame.
  const announced = useDebounced(hours.realistic, 700);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Mobile bar: hide it once the footer is on screen.
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setFooterVisible(entries.some((e) => e.isIntersecting)));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Reserve the bar's height at the bottom of the page so nothing hides behind it.
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el) return;
    const set = () => root.style.setProperty('--summary-bar-h', `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(set);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--summary-bar-h');
    };
  }, []);

  return (
    <>
      {/* Desktop: sticky sidebar card. */}
      <aside className={styles.panel} aria-labelledby="live-total-label">
        <p id="live-total-label" className={styles.label}>
          {WIZARD.live.label}
        </p>
        <p className={styles.figure}>
          <span className={`num ${styles.big}`} aria-hidden="true">
            {formatHours(animated)}
          </span>{' '}
          <span className={styles.unit} aria-hidden="true">
            {WIZARD.live.perWeek}
          </span>
          <span className="visually-hidden" aria-live="polite">
            {formatHours(announced)} {WIZARD.live.perWeek}
          </span>
        </p>
        <SummaryDetails results={results} weeklyHours={weeklyHours} />
      </aside>

      {/* Mobile: one fixed bar with the number and the step's Continue. Tap the number for the full card. */}
      <div ref={barRef} className={`${styles.bar} ${footerVisible ? styles.barHidden : ''}`} data-testid="summary-bar">
        <button
          type="button"
          className={styles.barSummary}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={`${WIZARD.live.label} ${formatHours(hours.realistic)} ${WIZARD.live.perWeek}. ${WIZARD.live.sheetOpen}`}
        >
          <span className={styles.barLabel}>{WIZARD.live.label}</span>
          <span className={styles.barFigure}>
            <span className={`num ${styles.barBig}`}>{formatHours(animated)}</span> {WIZARD.live.perWeekShort}
            <ChevronUp size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        </button>
        {action && (
          <Button className={styles.barAction} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>

      {sheetOpen && (
        <SummarySheet onClose={() => setSheetOpen(false)}>
          <p className={styles.figure}>
            <span className={`num ${styles.big}`}>{formatHours(hours.realistic)}</span>{' '}
            <span className={styles.unit}>{WIZARD.live.perWeek}</span>
          </p>
          <SummaryDetails results={results} weeklyHours={weeklyHours} />
        </SummarySheet>
      )}
    </>
  );
}
