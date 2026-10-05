import { ArrowDown, Lock } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { prefersReducedMotion } from '../../hooks/useAnimatedNumber';
import { useStagedCountUp } from '../../hooks/useStagedCountUp';
import { Button } from '../../components/Button/Button';
import { GateForm } from '../../components/GateForm/GateForm';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { FOOTNOTE, WIZARD } from '../../data/copy';
import { topTaskNames } from '../../engine/math';
import { qualify } from '../../engine/qualify';
import { buildReportUrl, toReportCalendar } from '../../engine/reportState';
import { buildRoadmap, taskMap } from '../../engine/roadmap';
import type { GhlHidden } from '../../lib/ghl';
import { getUtm } from '../../lib/utm';
import styles from './Step.module.css';
import local from './StepPreview.module.css';
import type { StepProps } from './types';
import { hoursRange, moneyRange } from '../../lib/display';

export function siteOrigin(): string {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');
}

interface FigureProps {
  label: string;
  low: number;
  high: number;
  delay: number;
  format: (low: number, high: number) => string;
  className?: string;
}

/** A results figure that appears and counts up once (staged reveal); screen readers get the final value. */
function Figure({ label, low, high, delay, format, className }: FigureProps) {
  const a = useStagedCountUp(low, delay);
  const b = useStagedCountUp(high, delay);
  return (
    <div className={[local.figure, className, a.shown ? local.shown : ''].filter(Boolean).join(' ')}>
      <dt>{label}</dt>
      <dd>
        <span aria-hidden="true">{format(a.value, b.value)}</span>
        <span className="visually-hidden">{format(low, high)}</span>
      </dd>
    </div>
  );
}

export function StepPreview({ state, tasks, results, go, focusHeading }: StepProps) {
  const p = WIZARD.preview;
  const { about, calendar } = state;

  const roadmap = useMemo(() => buildRoadmap(tasks), [tasks]);
  const gateRef = useRef<HTMLElement>(null);
  const toForm = () => {
    gateRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    gateRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  };
  const map = useMemo(() => taskMap(tasks), [tasks]);

  const prefill = useMemo(
    () => ({ firstName: about.firstName, role: about.role, revenue: about.revenue, timeline: about.timeline }),
    [about.firstName, about.role, about.revenue, about.timeline],
  );

  const hidden: GhlHidden = useMemo(() => {
    const q = qualify({
      role: about.role,
      revenue: about.revenue,
      timeline: about.timeline,
      delegableHours: results.hours.realistic,
    });
    const { url } = buildReportUrl(siteOrigin(), {
      firstName: about.firstName,
      rate: about.rate,
      tasks,
      calendar: calendar ? toReportCalendar(calendar) : null,
    });
    const topTasks = topTaskNames(tasks);
    return {
      delegableHours: results.hours.realistic,
      hoursLow: results.hours.low,
      monthlyCost: results.monthly.realistic,
      annualCost: results.annual.realistic,
      roiMultiple: results.roiMultiple,
      topTasks,
      reportUrl: url,
      qualified: q.qualified,
      tier: q.tier,
      utm: getUtm(),
    };
  }, [about, calendar, tasks, results]);

  return (
    <div className={styles.step}>
      <StepHeading focus={focusHeading}>{p.heading(about.firstName)}</StepHeading>

      <dl className={local.numbers}>
        <Figure className={local.lead} delay={0} label={p.hours} low={results.hours.low} high={results.hours.realistic} format={hoursRange} />
        <Figure delay={450} label={p.month} low={results.monthly.low} high={results.monthly.realistic} format={moneyRange} />
        <Figure delay={900} label={p.year} low={results.annual.low} high={results.annual.realistic} format={moneyRange} />
      </dl>
      <p className={styles.footnote}>{FOOTNOTE}</p>

      {/* Locked preview: the whole card takes the visitor to the form. */}
      <section className={local.preview} aria-label={p.blurredLabel}>
        <div className={local.blur} aria-hidden="true">
          <div>
            <h3>Weeks 1–2</h3>
            <ul>
              {roadmap.weeks1to2.map((i) => (
                <li key={i.taskId || i.name}>{i.name}</li>
              ))}
            </ul>
            <h3>Month 1</h3>
            <ul>
              {roadmap.month1.map((i) => (
                <li key={i.taskId}>{i.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Hand off</h3>
            <ul>
              {[...map.handOff, ...map.handOffWithApproval].map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
            <h3>Keep</h3>
            <ul>
              {map.keep.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          </div>
        </div>
        <button type="button" className={local.unlock} onClick={toForm}>
          <span className={local.lock} aria-hidden="true">
            <Lock size={22} strokeWidth={1.75} />
          </span>
          <span className={local.unlockText}>{p.locked}</span>
          <span className={local.unlockAction}>
            {p.lockedAction}
            <ArrowDown size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        </button>
      </section>

      <section className={local.gate} aria-labelledby="gate-heading" ref={gateRef}>
        <h2 id="gate-heading" tabIndex={-1}>
          {p.gate}
        </h2>
        <GateForm
          formId={import.meta.env.VITE_GHL_FORM_ID}
          prefill={prefill}
          hidden={hidden}
        />
      </section>

      <div className={styles.nav}>
        <Button variant="quiet" onClick={() => go(3)}>
          {WIZARD.nav.back}
        </Button>
      </div>
    </div>
  );
}
