import { computeResults, cumulative12Months, hoursByArea, type AreaHours, type CumulativePoint, type Results } from '../engine/math';
import { buildRoadmap, taskMap, type Roadmap, type TaskMapBucket } from '../engine/roadmap';
import { decodeReport } from '../engine/reportState';
import type { ReportCalendar, ReportState, TaskInput } from '../engine/types';

/** Everything the report page and the PDF show, derived once from the URL state. */
export interface ReportModel {
  firstName: string;
  rate: number;
  tasks: TaskInput[];
  results: Results;
  byArea: AreaHours[];
  cumulative: { realistic: CumulativePoint[]; low: CumulativePoint[] };
  roadmap: Roadmap;
  map: Record<TaskMapBucket, TaskInput[]>;
  calendar: ReportCalendar | null;
}

export function buildReportModel(state: ReportState): ReportModel {
  const results = computeResults(state.tasks, state.rate);
  return {
    firstName: state.firstName,
    rate: state.rate,
    tasks: state.tasks,
    results,
    byArea: hoursByArea(state.tasks).filter((a) => a.total > 0),
    cumulative: {
      realistic: cumulative12Months(results.hours.realistic, state.rate),
      low: cumulative12Months(results.hours.low, state.rate),
    },
    roadmap: buildRoadmap(state.tasks),
    map: taskMap(state.tasks),
    calendar: state.calendar,
  };
}

/** "Founder-Freedom-Report-<FirstName>.pdf", with the name reduced to safe filename characters. */
export function pdfFileName(firstName: string): string {
  const safe = firstName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return safe ? `Founder-Freedom-Report-${safe}.pdf` : 'Founder-Freedom-Report.pdf';
}

/** Turn an absolute report URL into an in-app path, so links work on preview deploys too. */
export function reportPath(reportUrl: string): string | null {
  try {
    const u = new URL(reportUrl);
    return u.pathname === '/report' && u.searchParams.get('d') ? `${u.pathname}${u.search}` : null;
  } catch {
    return null;
  }
}

/** The report behind a completed run, decoded from its stored link (null if missing or broken). */
export function reportFromRun(run: { reportUrl: string } | null): { path: string; state: ReportState } | null {
  const path = run ? reportPath(run.reportUrl) : null;
  if (!path) return null;
  const state = decodeReport(new URLSearchParams(path.split('?')[1]).get('d'));
  return state ? { path, state } : null;
}
