import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button/Button';
import { Heatmap } from '../components/Heatmap/Heatmap';
import { PageShell } from '../components/PageShell/PageShell';
import { FOOTNOTE, WIZARD } from '../data/copy';
import { NAV, REPORT } from '../data/pageCopy';
import { formatHours, formatMoney, formatMultiple } from '../engine/format';
import { decodeReport } from '../engine/reportState';
import type { RoadmapItem } from '../engine/roadmap';
import '../report/charts.css';
import { METHOD_ITEMS } from '../report/method';
import { buildReportModel, pdfFileName, type ReportModel } from '../report/model';
import { WeekChart } from '../report/WeekChart';
import { YearChart } from '../report/YearChart';
import styles from './Report.module.css';

function Method({ open = false }: { open?: boolean }) {
  return (
    <section id="method" aria-labelledby="method-heading" className={styles.section}>
      <h2 id="method-heading">{REPORT.method.heading}</h2>
      <details open={open} className={styles.method}>
        <summary>{REPORT.method.toggle}</summary>
        <dl>
          {METHOD_ITEMS.map((m) => (
            <div key={m.title}>
              <dt>{m.title}</dt>
              <dd>{m.text}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

function PdfButton({ model }: { model: ReportModel }) {
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');

  async function download() {
    setState('working');
    try {
      const [{ pdf }, { ReportDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/ReportPdf/ReportDocument'),
      ]);
      const blob = await pdf(<ReportDocument model={model} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName(model.firstName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <div className={styles.pdf}>
      <Button variant="secondary" onClick={download} disabled={state === 'working'}>
        {state === 'working' ? REPORT.pdf.working : REPORT.pdf.button}
      </Button>
      <p role="status" className={styles.error}>
        {state === 'error' ? REPORT.pdf.error : ''}
      </p>
    </div>
  );
}

function Phase({ n, title, items }: { n: number; title: string; items: RoadmapItem[] }) {
  return (
    <li className={styles.phase}>
      <h3>
        <span className={styles.phaseNum} aria-hidden="true">
          {n}
        </span>{' '}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className={styles.muted}>{REPORT.roadmap.empty}</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.taskId || i.name}>
              <p className={styles.itemName}>
                {i.name}
                {i.kind === 'task' && <span className={`num ${styles.muted}`}> · {REPORT.roadmap.hours(formatHours(i.hours))}</span>}
              </p>
              {i.kind === 'task' && <p className={styles.tip}>{i.tip}</p>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Report() {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const d = params.get('d');
  const model = useMemo(() => {
    const state = decodeReport(d);
    return state ? buildReportModel(state) : null;
  }, [d]);

  // React Router does not scroll to hashes (the landing page links to #method).
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  if (!model) {
    return (
      <PageShell>
        <section className={styles.section}>
          <h1>{REPORT.missing.heading}</h1>
          <p>{REPORT.missing.text}</p>
          <p>
            <ButtonLink to="/calculator">{NAV.start}</ButtonLink>
          </p>
        </section>
        <Method open />
      </PageShell>
    );
  }

  const { results, roadmap, map, calendar } = model;
  const [p1, p2, p3] = REPORT.roadmap.phases;

  return (
    <PageShell wide>
      <section className={styles.top}>
        <h1>{REPORT.title(model.firstName)}</h1>
        <PdfButton model={model} />
      </section>

      <section aria-label="Summary" className={styles.section}>
        <dl className={styles.summary}>
          <div className={styles.lead}>
            <dt>{REPORT.summary.hours}</dt>
            <dd>
              {formatHours(results.hours.low)}–{formatHours(results.hours.realistic)}
            </dd>
          </div>
          <div>
            <dt>{REPORT.summary.month}</dt>
            <dd>
              {formatMoney(results.monthly.low)}–{formatMoney(results.monthly.realistic)}
            </dd>
          </div>
          <div>
            <dt>{REPORT.summary.year}</dt>
            <dd>
              {formatMoney(results.annual.low)}–{formatMoney(results.annual.realistic)}
            </dd>
          </div>
          <div>
            <dt>{REPORT.summary.yearHours}</dt>
            <dd>
              {formatHours(results.hoursPerYear.low)}–{formatHours(results.hoursPerYear.realistic)}
            </dd>
          </div>
        </dl>
        <p className={styles.footnote}>{FOOTNOTE}</p>
      </section>

      {model.byArea.length > 0 && (
        <section aria-labelledby="week-heading" className={`${styles.section} ${styles.card}`}>
          <h2 id="week-heading">{REPORT.weekChart.heading}</h2>
          <WeekChart byArea={model.byArea} />
        </section>
      )}

      <section aria-labelledby="year-heading" className={`${styles.section} ${styles.card}`}>
        <h2 id="year-heading">{REPORT.yearChart.heading}</h2>
        <YearChart realistic={model.cumulative.realistic} low={model.cumulative.low} />
      </section>

      <section aria-labelledby="map-heading" className={styles.section}>
        <h2 id="map-heading">{REPORT.map.heading}</h2>
        <div className={styles.map}>
          {(
            [
              [REPORT.map.handOff, map.handOff, styles.colHanded],
              [REPORT.map.approval, map.handOffWithApproval, styles.colApproval],
              [REPORT.map.keep, map.keep, styles.colKeep],
            ] as const
          ).map(([title, list, cls]) => (
            <div key={title} className={cls}>
              <h3>{title}</h3>
              {list.length === 0 ? (
                <p className={styles.muted}>{REPORT.map.empty}</p>
              ) : (
                <ul>
                  {list.map((t) => (
                    <li key={t.id}>{t.name}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="plan-heading" className={styles.section}>
        <h2 id="plan-heading">{REPORT.roadmap.heading}</h2>
        <ol className={styles.timeline}>
          <Phase n={1} title={p1} items={roadmap.weeks1to2} />
          <Phase n={2} title={p2} items={roadmap.month1} />
          <Phase n={3} title={p3} items={roadmap.months2to3} />
        </ol>
      </section>

      {calendar && (
        <section aria-labelledby="calendar-heading" className={`${styles.section} ${styles.card}`}>
          <h2 id="calendar-heading">{REPORT.calendar.heading}</h2>
          <dl className={styles.summary}>
            <div>
              <dt>{WIZARD.calendar.stats.meetings}</dt>
              <dd>{formatHours(calendar.meetingHoursPerWeek)}</dd>
            </div>
            <div>
              <dt>{WIZARD.calendar.stats.focus}</dt>
              <dd>{formatHours(calendar.focusBlocksPerWeek)}</dd>
            </div>
            <div>
              <dt>{WIZARD.calendar.stats.fragmented}</dt>
              <dd>{formatHours(calendar.fragmentedHoursPerWeek)}</dd>
            </div>
          </dl>
          {calendar.heatmap && <Heatmap data={calendar.heatmap} caption={WIZARD.calendar.heatmapCaption} />}
        </section>
      )}

      <Method />

      <section aria-labelledby="cta-heading" className={styles.cta}>
        <h2 id="cta-heading">{REPORT.cta.heading}</h2>
        <p>
          Your hours are worth <span className="num">{formatMultiple(results.roiMultiple)}</span> the $3,000/mo annual plan.{' '}
          {REPORT.cta.text}
        </p>
        <p>
          <ButtonLink to="/book">{REPORT.cta.button}</ButtonLink>
        </p>
      </section>
    </PageShell>
  );
}
