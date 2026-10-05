import { describe, expect, it } from 'vitest';
import { defaultTasks, TASKS, taskFromDef } from '../../data/tasks';
import { PROGRAM_MONTHLY_ANNUAL_PLAN, YEAR1_ALL_IN } from '../constants';
import { formatHours, formatMoney, formatMultiple } from '../format';
import {
  annualCost,
  computeResults,
  cumulative12Months,
  delegableHoursWeek,
  effectiveRate,
  hoursByArea,
  hoursPerYear,
  hoursRange,
  monthlyCost,
  roiMultiple,
  topTaskNames,
  workloadNotice,
  year1Net,
} from '../math';
import { LIBRARY_AREAS, type TaskInput } from '../types';

const task = (hoursPerWeek: number, delegablePct: number, area: TaskInput['area'] = 'Inbox & calendar'): TaskInput => ({
  id: `t-${hoursPerWeek}-${delegablePct}-${area}`,
  name: 'Test task',
  area,
  hoursPerWeek,
  delegablePct,
  ease: 2,
  needsApproval: false,
  tip: '',
});

describe('test 1: Pareto parity', () => {
  it('rate $200, 12.5 hrs, 100% → $10,750/month and 3.58× vs $3,000', () => {
    const tasks = [task(12.5, 1)];
    const hours = delegableHoursWeek(tasks);
    expect(hours).toBe(12.5);

    const monthly = monthlyCost(hours, 200);
    expect(monthly).toBeCloseTo(10_750, 6);
    expect(formatMoney(monthly)).toBe('$10,750');

    const roi = roiMultiple(monthly);
    expect(roi).toBeCloseTo(10_750 / PROGRAM_MONTHLY_ANNUAL_PLAN, 10);
    expect(formatMultiple(roi)).toBe('3.58×');
  });

  it('derives annual cost, year-1 net and hours per year from the same inputs', () => {
    expect(annualCost(12.5, 200)).toBeCloseTo(129_000, 6);
    expect(year1Net(annualCost(12.5, 200))).toBeCloseTo(129_000 - YEAR1_ALL_IN.annual, 6);
    expect(hoursPerYear(12.5)).toBeCloseTo(645, 6);
  });
});

describe('test 2: no category is skipped', () => {
  it('the library covers all 7 areas', () => {
    expect(new Set(TASKS.map((t) => t.area))).toEqual(new Set(LIBRARY_AREAS));
  });

  it('every library area counts toward the total (BELAY regression)', () => {
    const all = TASKS.map((t) => taskFromDef(t));
    const expected = TASKS.reduce((s, t) => s + t.defaultHours * t.defaultPct, 0);
    expect(delegableHoursWeek(all)).toBeCloseTo(expected, 10);

    for (const area of LIBRARY_AREAS) {
      const without = all.filter((t) => t.area !== area);
      const areaHours = all.filter((t) => t.area === area).reduce((s, t) => s + t.hoursPerWeek * t.delegablePct, 0);
      expect(areaHours, area).toBeGreaterThan(0);
      expect(delegableHoursWeek(all) - delegableHoursWeek(without), area).toBeCloseTo(areaHours, 10);
    }
  });

  it('hoursByArea sums back to the totals', () => {
    const all = TASKS.map((t) => taskFromDef(t));
    const rows = hoursByArea(all);
    expect(rows.map((r) => r.area)).toEqual([...LIBRARY_AREAS]);
    expect(rows.reduce((s, r) => s + r.delegable, 0)).toBeCloseTo(delegableHoursWeek(all), 10);
    for (const r of rows) expect(r.kept).toBeCloseTo(r.total - r.delegable, 10);
  });
});

describe('test 3: range', () => {
  it('low = 0.7 × realistic', () => {
    for (const h of [0, 1, 12.5, 16.05, 37.25]) {
      const r = hoursRange(h);
      expect(r.realistic).toBe(h);
      expect(r.low).toBeCloseTo(0.7 * h, 12);
    }
  });

  it('computeResults applies the range to money too', () => {
    const res = computeResults([task(10, 1)], 200);
    expect(res.hours).toEqual({ low: 7, realistic: 10 });
    expect(res.monthly.low).toBeCloseTo(0.7 * res.monthly.realistic, 8);
    expect(res.annual.realistic).toBeCloseTo(res.monthly.realistic * 12, 8);
  });
});

describe('defaults', () => {
  it('14 tasks are preselected and they clear the 10h qualification line', () => {
    const tasks = defaultTasks();
    expect(tasks).toHaveLength(14);
    expect(delegableHoursWeek(tasks)).toBeCloseTo(16.05, 10);
  });
});

describe('helpers', () => {
  it('effective rate = yearly target ÷ (weekly hours × 48)', () => {
    expect(effectiveRate(480_000, 50)).toBe(200);
    expect(effectiveRate(100_000, 0)).toBe(0);
  });

  it('cumulative 12 months grows linearly', () => {
    const pts = cumulative12Months(10, 200);
    expect(pts).toHaveLength(12);
    expect(pts[0]!.hours).toBeCloseTo(43, 8);
    expect(pts[11]!.dollars).toBeCloseTo(annualCost(10, 200), 6);
  });

  it('workload notice: over the weekly total, over 80%, or nothing', () => {
    expect(workloadNotice(56, 55)).toBe('over');
    expect(workloadNotice(45, 55)).toBe('high'); // 81.8%
    expect(workloadNotice(44, 55)).toBeNull(); // exactly 80%
    expect(workloadNotice(20, 55)).toBeNull();
    expect(workloadNotice(20, 0)).toBeNull();
  });

  it('formats hours with one decimal at most', () => {
    expect(formatHours(16.05)).toBe('16.1');
    expect(formatHours(12)).toBe('12');
  });
});

describe('topTaskNames', () => {
  it('top 3 by delegable hours, ties in input order, zero-hour tasks never listed', () => {
    expect(topTaskNames(defaultTasks())).toEqual([
      'Sorting and answering email',
      'Scheduling and rescheduling meetings',
      'Follow-ups after calls', // ties with tracker/research at 1.2h; library order wins
    ]);
    expect(topTaskNames([task(0, 1), task(2, 0)])).toEqual([]);
  });
});
