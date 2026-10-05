import { describe, expect, it } from 'vitest';
import { defaultTasks } from '../../data/tasks';
import { analyzeCalendar } from '../calendar';
import { formatHours, formatMoney, formatMultiple } from '../format';
import { computeResults, cumulative12Months, hoursByArea, workloadNotice } from '../math';
import { qualify } from '../qualify';
import { buildRoadmap } from '../roadmap';
import { decodeReport, encodeReport } from '../reportState';
import type { TaskInput } from '../types';

/** Walk any value and collect every number that is not finite. */
function badNumbers(value: unknown, path = '$'): string[] {
  if (typeof value === 'number') return Number.isFinite(value) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => badNumbers(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => badNumbers(v, `${path}.${k}`));
  }
  return [];
}

function everything(tasks: TaskInput[], rate: number) {
  const results = computeResults(tasks, rate);
  return {
    results,
    byArea: hoursByArea(tasks),
    cumulative: cumulative12Months(results.hours.realistic, rate),
    roadmap: buildRoadmap(tasks),
    qualification: qualify({ role: 'Founder / Owner', revenue: '$1M–$5M', timeline: 'Now', delegableHours: results.hours.realistic }),
    notice: workloadNotice(results.totalHours, 55),
    report: decodeReport(encodeReport({ firstName: '', rate, tasks, calendar: null })),
    formatted: [
      formatMoney(results.monthly.realistic),
      formatMoney(results.year1Net),
      formatHours(results.hours.low),
      formatMultiple(results.roiMultiple),
    ],
  };
}

describe('test 8: edge cases produce no NaN anywhere', () => {
  const zeroHours = defaultTasks().map((t) => ({ ...t, hoursPerWeek: 0 }));
  const garbage = defaultTasks().map((t, i) => ({
    ...t,
    hoursPerWeek: [Number.NaN, -3, Number.POSITIVE_INFINITY][i % 3]!,
    delegablePct: [Number.NaN, 7, -1][i % 3]!,
  }));

  it.each([
    ['zero tasks', [] as TaskInput[], 200],
    ['rate 0', defaultTasks(), 0],
    ['hours 0', zeroHours, 200],
    ['NaN / negative / infinite inputs', garbage, Number.NaN],
  ])('%s', (_label, tasks, rate) => {
    const out = everything(tasks, rate);
    expect(badNumbers(out)).toEqual([]);
    expect(out.formatted.join(' ')).not.toMatch(/NaN|Infinity/);
  });

  it('zero tasks: $0, 0h, not qualified, Weeks 1–2 still has the setup item', () => {
    const out = everything([], 200);
    expect(out.results.monthly.realistic).toBe(0);
    expect(out.qualification.reasons).toEqual(['hours']);
    expect(out.roadmap.weeks1to2).toHaveLength(1);
    expect(out.roadmap.weeks1to2[0]!.kind).toBe('setup');
    expect(out.formatted[1]).toBe('-$39,000'); // year-1 net is honest even at 0
  });

  it('rate 0: hours still count, money is $0', () => {
    const out = everything(defaultTasks(), 0);
    expect(out.results.hours.realistic).toBeGreaterThan(0);
    expect(out.results.monthly.realistic).toBe(0);
    expect(out.results.roiMultiple).toBe(0);
  });

  it('formatters never print NaN or Infinity', () => {
    expect(formatMoney(Number.NaN)).toBe('$0');
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('$0');
    expect(formatHours(Number.NaN)).toBe('0');
    expect(formatMultiple(Number.NaN)).toBe('0.00×');
  });

  it('an empty or junk calendar file gives zeros, not NaN', () => {
    const empty = analyzeCalendar('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', new Date(2026, 6, 15));
    expect(badNumbers(empty)).toEqual([]);
    expect(empty.meetingsPerWeek).toBe(0);
    expect(empty.focusBlocksPerWeek).toBe(5); // a fully free workday is one focus block
  });
});
