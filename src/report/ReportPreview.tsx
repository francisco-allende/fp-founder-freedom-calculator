import { useEffect, useMemo, useRef, useState } from 'react';
import { LANDING, REPORT } from '../data/pageCopy';
import { defaultTasks } from '../data/tasks';
import { DEFAULT_RATE } from '../engine/constants';
import { useElementWidth } from '../hooks/useElementWidth';
import { buildReportModel } from './model';
import { ReportSummary, RoadmapTimeline } from './sections';
import { WeekChart } from './WeekChart';
import './charts.css';
import styles from './ReportPreview.module.css';

/** Width the report is laid out at before scaling, so it looks like the real page. */
const DESIGN_WIDTH = 640;

/**
 * A real render of the report (same components as /report) with the default tasks, scaled to fit.
 * Decorative: hidden from assistive tech and not focusable.
 */
export default function ReportPreview() {
  const model = useMemo(() => buildReportModel({ firstName: '', rate: DEFAULT_RATE, tasks: defaultTasks(), calendar: null }), []);
  const [outerRef, outerWidth] = useElementWidth<HTMLDivElement>(DESIGN_WIDTH);
  const innerRef = useRef<HTMLDivElement>(null);
  const [innerHeight, setInnerHeight] = useState(900);
  const scale = Math.min(1, outerWidth / DESIGN_WIDTH) * 0.94;

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.setAttribute('inert', ''); // React 18 has no typed `inert` prop
    const measure = () => setInnerHeight(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <figure className={styles.figure}>
      <div ref={outerRef} className={styles.stage} style={{ height: innerHeight * scale + 24 }}>
        <div
          ref={innerRef}
          className={styles.paper}
          style={{ width: DESIGN_WIDTH, transform: `rotate(-1.5deg) scale(${scale})` }}
          aria-hidden="true"
        >
          <span className={styles.badge}>{LANDING.inside.previewBadge}</span>
          <h3 className={styles.title}>{REPORT.title('')}</h3>
          <ReportSummary results={model.results} showYearHours={false} />
          <WeekChart byArea={model.byArea} />
          <RoadmapTimeline roadmap={model.roadmap} limit={1} />
        </div>
      </div>
      <figcaption className={styles.caption}>{LANDING.inside.previewLabel}</figcaption>
    </figure>
  );
}
