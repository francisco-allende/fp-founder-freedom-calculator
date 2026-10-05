import { useMemo } from 'react';
import { Button } from '../../components/Button/Button';
import { GateForm } from '../../components/GateForm/GateForm';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { FOOTNOTE, WIZARD } from '../../data/copy';
import { formatHours, formatMoney } from '../../engine/format';
import { taskDelegableHours } from '../../engine/math';
import { qualify } from '../../engine/qualify';
import { buildReportUrl, toReportCalendar } from '../../engine/reportState';
import { buildRoadmap, taskMap } from '../../engine/roadmap';
import type { GhlHidden } from '../../lib/ghl';
import { getUtm } from '../../lib/utm';
import styles from './Step.module.css';
import local from './StepPreview.module.css';
import type { StepProps } from './types';

export function siteOrigin(): string {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');
}

export function StepPreview({ state, tasks, results, go, focusHeading }: StepProps) {
  const p = WIZARD.preview;
  const { about, calendar } = state;

  const roadmap = useMemo(() => buildRoadmap(tasks), [tasks]);
  const map = useMemo(() => taskMap(tasks), [tasks]);

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
    const topTasks = [...tasks]
      .sort((a, b) => taskDelegableHours(b) - taskDelegableHours(a))
      .filter((t) => taskDelegableHours(t) > 0)
      .slice(0, 3)
      .map((t) => t.name);
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
        <div className={local.lead}>
          <dt>{p.hours}</dt>
          <dd className="num">
            {formatHours(results.hours.low)}–{formatHours(results.hours.realistic)}
          </dd>
        </div>
        <div>
          <dt>{p.month}</dt>
          <dd className="num">
            {formatMoney(results.monthly.low)}–{formatMoney(results.monthly.realistic)}
          </dd>
        </div>
        <div>
          <dt>{p.year}</dt>
          <dd className="num">
            {formatMoney(results.annual.low)}–{formatMoney(results.annual.realistic)}
          </dd>
        </div>
      </dl>
      <p className={styles.footnote}>{FOOTNOTE}</p>

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
        <p className={local.overlay}>{p.blurredLabel}</p>
      </section>

      <section className={local.gate} aria-labelledby="gate-heading">
        <h2 id="gate-heading">{p.gate}</h2>
        <GateForm
          formId={import.meta.env.VITE_GHL_FORM_ID}
          prefill={{ firstName: about.firstName, role: about.role, revenue: about.revenue, timeline: about.timeline }}
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
