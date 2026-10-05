import LZString from 'lz-string';
import { customTask, taskFromDef, TASKS_BY_ID } from '../data/tasks';
import { MAX_REPORT_URL_LENGTH } from './constants';
import { nonNeg } from './math';
import { sanitizeName } from './sanitize';
import type { CalendarSummary, ReportCalendar, ReportState, TaskInput } from './types';

// SPEC §5.6. Wire format: {v:1, n, r, t:[[id,h,pct] | [name,h,pct,"c"]], c}.
// No email, no revenue, no raw calendar events ever go in here.

const VERSION = 1;
const MAX_HOURS = 10;
const MAX_RATE = 100_000;
const MAX_TASKS = 60;
const HEATMAP_DAYS = 7;
const HEATMAP_SLOTS = 17;

type WireTask = [string, number, number] | [string, number, number, 'c'];

interface WireCalendar {
  mh: number;
  mc: number;
  fb: number;
  fh: number;
  /** Heatmap flattened row by row (7 × 17), or absent when dropped for length. */
  h?: number[];
}

interface Wire {
  v: number;
  n: string;
  r: number;
  t: WireTask[];
  c: WireCalendar | null;
}

export function toReportCalendar(summary: CalendarSummary): ReportCalendar {
  return {
    meetingHoursPerWeek: summary.meetingHoursPerWeek,
    meetingsPerWeek: summary.meetingsPerWeek,
    focusBlocksPerWeek: summary.focusBlocksPerWeek,
    fragmentedHoursPerWeek: summary.fragmentedHoursPerWeek,
    heatmap: summary.heatmap,
  };
}

const roundHours = (h: number) => Math.round(Math.min(MAX_HOURS, nonNeg(h)) * 4) / 4;
const toPctInt = (p: number) => Math.round(Math.min(1, nonNeg(p)) * 100);

function toWire(state: ReportState, includeHeatmap: boolean): Wire {
  const t: WireTask[] = state.tasks.map((task) =>
    task.custom
      ? [sanitizeName(task.name), roundHours(task.hoursPerWeek), toPctInt(task.delegablePct), 'c']
      : [task.id, roundHours(task.hoursPerWeek), toPctInt(task.delegablePct)],
  );
  const cal = state.calendar;
  const c: WireCalendar | null = cal
    ? {
        mh: nonNeg(cal.meetingHoursPerWeek),
        mc: nonNeg(cal.meetingsPerWeek),
        fb: nonNeg(cal.focusBlocksPerWeek),
        fh: nonNeg(cal.fragmentedHoursPerWeek),
        ...(includeHeatmap && cal.heatmap ? { h: cal.heatmap.flat().map((m) => Math.round(nonNeg(m))) } : {}),
      }
    : null;
  return { v: VERSION, n: sanitizeName(state.firstName), r: Math.min(MAX_RATE, nonNeg(state.rate)), t, c };
}

function compress(wire: Wire): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(wire));
}

export function encodeReport(state: ReportState, opts: { includeHeatmap?: boolean } = {}): string {
  return compress(toWire(state, opts.includeHeatmap ?? true));
}

function reportUrlFor(origin: string, d: string): string {
  return `${origin.replace(/\/+$/, '')}/report?d=${d}`;
}

/**
 * Full report URL. If it would exceed 2,000 chars, the heatmap is dropped and only
 * the four calendar summary stats are kept.
 */
export function buildReportUrl(origin: string, state: ReportState): { url: string; heatmapDropped: boolean } {
  const full = reportUrlFor(origin, encodeReport(state, { includeHeatmap: true }));
  if (full.length < MAX_REPORT_URL_LENGTH || !state.calendar?.heatmap) {
    return { url: full, heatmapDropped: false };
  }
  return { url: reportUrlFor(origin, encodeReport(state, { includeHeatmap: false })), heatmapDropped: true };
}

// ---- decode: every field is untrusted ----

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number => (typeof x === 'number' ? nonNeg(x) : 0);

function decodeTask(raw: unknown, index: number): TaskInput | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const [key, hours, pct, flag] = raw as unknown[];
  const h = roundHours(num(hours));
  const p = Math.min(100, Math.round(num(pct))) / 100;

  if (flag === 'c') {
    const name = sanitizeName(key);
    return name ? customTask(`custom-${index}`, name, h, p) : null;
  }
  const def = typeof key === 'string' ? TASKS_BY_ID.get(key) : undefined;
  return def ? taskFromDef(def, h, p) : null;
}

function decodeHeatmap(raw: unknown): number[][] | null {
  if (!Array.isArray(raw) || raw.length !== HEATMAP_DAYS * HEATMAP_SLOTS) return null;
  if (!raw.every((m) => typeof m === 'number' && Number.isFinite(m) && m >= 0 && m <= 60)) return null;
  const flat = raw as number[];
  return Array.from({ length: HEATMAP_DAYS }, (_, d) => flat.slice(d * HEATMAP_SLOTS, (d + 1) * HEATMAP_SLOTS));
}

function decodeCalendar(raw: unknown): ReportCalendar | null {
  if (!isObj(raw)) return null;
  return {
    meetingHoursPerWeek: num(raw.mh),
    meetingsPerWeek: num(raw.mc),
    focusBlocksPerWeek: num(raw.fb),
    fragmentedHoursPerWeek: num(raw.fh),
    heatmap: decodeHeatmap(raw.h),
  };
}

/** Returns null when `d` is missing, corrupt, or from an unknown version. */
export function decodeReport(d: string | null | undefined): ReportState | null {
  if (!d) return null;
  let parsed: unknown;
  try {
    const json = LZString.decompressFromEncodedURIComponent(d);
    if (!json) return null;
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isObj(parsed) || parsed.v !== VERSION) return null;

  const rawTasks = Array.isArray(parsed.t) ? parsed.t.slice(0, MAX_TASKS) : [];
  const seen = new Set<string>();
  const tasks: TaskInput[] = [];
  rawTasks.forEach((raw, i) => {
    const task = decodeTask(raw, i);
    if (!task || seen.has(task.id)) return;
    seen.add(task.id);
    tasks.push(task);
  });

  return {
    firstName: sanitizeName(parsed.n),
    rate: Math.min(MAX_RATE, num(parsed.r)),
    tasks,
    calendar: decodeCalendar(parsed.c),
  };
}
