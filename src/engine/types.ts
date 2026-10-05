export const LIBRARY_AREAS = [
  'Inbox & calendar',
  'Projects & follow-through',
  'Systems & automation',
  'Content & comms',
  'Money & admin',
  'Team & clients',
  'Personal',
] as const;

export type LibraryArea = (typeof LIBRARY_AREAS)[number];
/** Custom tasks added by the founder live in their own area. */
export type Area = LibraryArea | 'Your own tasks';

export type Ease = 1 | 2 | 3;

/** A task as defined in the library (SPEC §7). Percentages are fractions 0–1. */
export interface TaskDef {
  id: string;
  area: LibraryArea;
  name: string;
  defaultHours: number;
  defaultPct: number;
  ease: Ease;
  pre: boolean;
  appr: boolean;
  tip: string;
}

/** A task as the founder configured it. `delegablePct` is a fraction 0–1. */
export interface TaskInput {
  id: string;
  name: string;
  area: Area;
  hoursPerWeek: number;
  delegablePct: number;
  ease: Ease;
  needsApproval: boolean;
  tip: string;
  custom?: boolean;
}

export interface HoursRange {
  low: number;
  realistic: number;
}

export const CALENDAR_CATEGORIES = [
  'Client & sales',
  'Internal',
  'Hiring',
  'Content',
  'Other meetings',
] as const;

export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

/** Output of the calendar X-ray (SPEC §5.3). All per-week values are averages over the window. */
export interface CalendarSummary {
  weeks: number;
  meetingHoursPerWeek: number;
  meetingsPerWeek: number;
  focusBlocksPerWeek: number;
  fragmentedHoursPerWeek: number;
  personalHoursPerWeek: number;
  categoryHoursPerWeek: Record<CalendarCategory, number>;
  /** [7 days Mon–Sun][17 slots starting 6:00…22:00], whole minutes booked per slot. */
  heatmap: number[][];
  /**
   * ESTIMATES the founder can accept one by one into step 2:
   * scheduling → "sched", prep → "brief", followUp → "followup".
   */
  suggestedHours: { scheduling: number; prep: number; followUp: number };
}

/** The slice of the calendar summary that travels in the report URL (SPEC §5.6). */
export interface ReportCalendar {
  meetingHoursPerWeek: number;
  meetingsPerWeek: number;
  focusBlocksPerWeek: number;
  fragmentedHoursPerWeek: number;
  heatmap: number[][] | null;
}

export interface ReportState {
  firstName: string;
  rate: number;
  tasks: TaskInput[];
  calendar: ReportCalendar | null;
}
