import {
  CONSERVATIVE_FACTOR,
  PROGRAM_MONTHLY_ANNUAL_PLAN,
  WEEKS_PER_MONTH,
  WORK_WEEKS_PER_YEAR,
  YEAR1_ALL_IN,
} from './constants';
import type { Area, HoursRange, TaskInput } from './types';

// SPEC §5.2. No rounding here; rounding happens only at display time (format.ts).

/** Coerce anything non-finite or negative to 0 so no NaN ever reaches the page. */
export function nonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function clampPct(p: number): number {
  return Math.min(1, nonNeg(p));
}

export function taskDelegableHours(task: Pick<TaskInput, 'hoursPerWeek' | 'delegablePct'>): number {
  return nonNeg(task.hoursPerWeek) * clampPct(task.delegablePct);
}

/** Σ task.hoursPerWeek × task.delegablePct, over every task regardless of area. */
export function delegableHoursWeek(tasks: readonly TaskInput[]): number {
  return tasks.reduce((sum, t) => sum + taskDelegableHours(t), 0);
}

export function totalTaskHours(tasks: readonly TaskInput[]): number {
  return tasks.reduce((sum, t) => sum + nonNeg(t.hoursPerWeek), 0);
}

export function hoursRange(delegableHours: number): HoursRange {
  const realistic = nonNeg(delegableHours);
  return { low: realistic * CONSERVATIVE_FACTOR, realistic };
}

export function monthlyCost(hoursPerWeek: number, rate: number): number {
  return nonNeg(hoursPerWeek) * nonNeg(rate) * WEEKS_PER_MONTH;
}

export function annualCost(hoursPerWeek: number, rate: number): number {
  return monthlyCost(hoursPerWeek, rate) * 12;
}

export function roiMultiple(monthlyCostRealistic: number): number {
  return nonNeg(monthlyCostRealistic) / PROGRAM_MONTHLY_ANNUAL_PLAN;
}

export function year1Net(annualCostRealistic: number): number {
  return nonNeg(annualCostRealistic) - YEAR1_ALL_IN.annual;
}

export function hoursPerYear(hoursPerWeek: number): number {
  return nonNeg(hoursPerWeek) * WEEKS_PER_MONTH * 12;
}

/** "Not sure?" helper: yearly income or profit target ÷ (weekly hours × 48). */
export function effectiveRate(yearlyTarget: number, weeklyHours: number): number {
  const denom = nonNeg(weeklyHours) * WORK_WEEKS_PER_YEAR;
  return denom === 0 ? 0 : nonNeg(yearlyTarget) / denom;
}

export interface Results {
  totalHours: number;
  hours: HoursRange;
  monthly: HoursRange;
  annual: HoursRange;
  hoursPerYear: HoursRange;
  roiMultiple: number;
  year1Net: number;
}

export function computeResults(tasks: readonly TaskInput[], rate: number): Results {
  const hours = hoursRange(delegableHoursWeek(tasks));
  const both = (f: (h: number) => number): HoursRange => ({ low: f(hours.low), realistic: f(hours.realistic) });
  const monthly = both((h) => monthlyCost(h, rate));
  const annual = both((h) => annualCost(h, rate));
  return {
    totalHours: totalTaskHours(tasks),
    hours,
    monthly,
    annual,
    hoursPerYear: both(hoursPerYear),
    roiMultiple: roiMultiple(monthly.realistic),
    year1Net: year1Net(annual.realistic),
  };
}

export interface AreaHours {
  area: Area;
  total: number;
  delegable: number;
  /** Hours that stay with the founder: total − delegable. */
  kept: number;
}

/** Per-area totals for "your week today vs with a Right Hand", in first-seen order. */
export function hoursByArea(tasks: readonly TaskInput[]): AreaHours[] {
  const byArea = new Map<Area, AreaHours>();
  for (const t of tasks) {
    const row = byArea.get(t.area) ?? { area: t.area, total: 0, delegable: 0, kept: 0 };
    row.total += nonNeg(t.hoursPerWeek);
    row.delegable += taskDelegableHours(t);
    row.kept = row.total - row.delegable;
    byArea.set(t.area, row);
  }
  return [...byArea.values()];
}

export interface CumulativePoint {
  month: number;
  hours: number;
  dollars: number;
}

/** 12-month cumulative hours and dollars won back at a given weekly rate of handoff. */
export function cumulative12Months(hoursPerWeek: number, rate: number): CumulativePoint[] {
  const monthlyHours = nonNeg(hoursPerWeek) * WEEKS_PER_MONTH;
  const monthlyDollars = monthlyCost(hoursPerWeek, rate);
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    hours: monthlyHours * (i + 1),
    dollars: monthlyDollars * (i + 1),
  }));
}

export type WorkloadNotice = 'over' | 'high' | null;

/** Soft notice in step 2: task hours vs. weekly hours worked. Informational, never an error. */
export function workloadNotice(taskHours: number, weeklyHours: number): WorkloadNotice {
  const weekly = nonNeg(weeklyHours);
  const hours = nonNeg(taskHours);
  if (weekly === 0) return null;
  if (hours > weekly) return 'over';
  if (hours > weekly * 0.8) return 'high';
  return null;
}
