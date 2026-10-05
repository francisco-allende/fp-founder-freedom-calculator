import ICAL from 'ical.js';
import type { CalendarCategory, CalendarSummary } from './types';
import { CALENDAR_CATEGORIES } from './types';

// SPEC §5.3. Runs entirely in the browser; nothing here touches the network.

export const WINDOW_WEEKS = 4;
const MAX_EVENT_MINUTES = 8 * 60;
const HEATMAP_FIRST_HOUR = 6;
const HEATMAP_SLOTS = 17; // slots start 6:00, 7:00, …, 22:00
const WORKDAY_START_HOUR = 9;
const WORKDAY_END_HOUR = 18;
const FOCUS_MIN_MINUTES = 90;
const FRAGMENT_MAX_MINUTES = 30;
const SCHEDULING_MIN_PER_MEETING = 10; // ESTIMATE
const PREP_MIN_PER_MEETING = 15; // ESTIMATE
/** Safety valve for pathological RRULEs (e.g. minutely, no end). */
const MAX_ITERATIONS_PER_EVENT = 50_000;

const PERSONAL = /gym|doctor|dentist|kids|school|pickup|birthday|dinner|lunch with|vacation|flight|family/i;
const CATEGORY_RULES: [RegExp, CalendarCategory][] = [
  [/client|demo|sales|prospect|discovery/i, 'Client & sales'],
  [/sync|standup|1:1|1on1|weekly|team/i, 'Internal'],
  [/interview|hiring|candidate/i, 'Hiring'],
  [/podcast|recording|webinar/i, 'Content'],
];

export function categorize(title: string): CalendarCategory {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(title)) return cat;
  return 'Other meetings';
}

export function isPersonal(title: string): boolean {
  return PERSONAL.test(title);
}

/** Last 4 complete Mon–Sun weeks before `now`, in local time. */
export function analysisWindow(now: Date): { start: Date; end: Date } {
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - WINDOW_WEEKS * 7);
  return { start, end };
}

interface Occurrence {
  start: number; // epoch ms
  end: number;
  title: string;
  personal: boolean;
}

type VEvent = InstanceType<typeof ICAL.Component>;

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.replace(/^mailto:/i, '').trim().toLowerCase() : '';
}

/** Google exports put the owner's email in X-WR-CALNAME; otherwise use the most frequent ORGANIZER. */
function findOwner(vcal: VEvent, vevents: VEvent[]): string {
  const calName = normalizeEmail(vcal.getFirstPropertyValue('x-wr-calname'));
  if (calName.includes('@')) return calName;
  const counts = new Map<string, number>();
  for (const ev of vevents) {
    const org = normalizeEmail(ev.getFirstPropertyValue('organizer'));
    if (org) counts.set(org, (counts.get(org) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [email, count] of counts) if (count > bestCount) [best, bestCount] = [email, count];
  return best;
}

/** True when the event should not count at all (before looking at its times). */
function isExcluded(ev: VEvent, owner: string): boolean {
  if (String(ev.getFirstPropertyValue('transp') ?? '').toUpperCase() === 'TRANSPARENT') return true;
  if (String(ev.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED') return true;
  if (owner) {
    for (const att of ev.getAllProperties('attendee')) {
      if (
        normalizeEmail(att.getFirstValue()) === owner &&
        String(att.getParameter('partstat') ?? '').toUpperCase() === 'DECLINED'
      ) {
        return true;
      }
    }
  }
  return false;
}

function addOccurrence(
  out: Occurrence[],
  ev: VEvent,
  start: InstanceType<typeof ICAL.Time>,
  end: InstanceType<typeof ICAL.Time>,
  owner: string,
): void {
  if (start.isDate) return; // all-day
  if (isExcluded(ev, owner)) return;
  const s = start.toJSDate().getTime();
  const e = end.toJSDate().getTime();
  const minutes = (e - s) / 60_000;
  if (!(minutes > 0) || minutes > MAX_EVENT_MINUTES) return;
  const title = String(ev.getFirstPropertyValue('summary') ?? '');
  out.push({ start: s, end: e, title, personal: isPersonal(title) });
}

function collectOccurrences(icsText: string, windowStart: number, windowEnd: number): Occurrence[] {
  const parsed = ICAL.parse(icsText);
  const roots = (Array.isArray(parsed[0]) ? parsed : [parsed]) as unknown[];
  const out: Occurrence[] = [];

  for (const root of roots) {
    const vcal = new ICAL.Component(root as ConstructorParameters<typeof ICAL.Component>[0]);
    for (const tz of vcal.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz);

    const vevents = vcal.getAllSubcomponents('vevent');
    const owner = findOwner(vcal, vevents);

    const masters = new Map<string, InstanceType<typeof ICAL.Event>>();
    const exceptions: VEvent[] = [];
    const singles: VEvent[] = [];
    for (const ev of vevents) {
      if (ev.hasProperty('recurrence-id')) exceptions.push(ev);
      else if (ev.hasProperty('rrule') || ev.hasProperty('rdate')) {
        masters.set(String(ev.getFirstPropertyValue('uid')), new ICAL.Event(ev));
      } else singles.push(ev);
    }

    // Exceptions attach to their recurring master; orphans are treated as single events.
    for (const ex of exceptions) {
      const master = masters.get(String(ex.getFirstPropertyValue('uid')));
      if (master) master.relateException(ex);
      else singles.push(ex);
    }

    for (const ev of singles) {
      const dtstart = ev.getFirstPropertyValue('dtstart');
      if (!(dtstart instanceof ICAL.Time)) continue;
      // Cheap rejects before building an Event (most of a multi-year export is outside the window).
      if (dtstart.isDate || dtstart.toJSDate().getTime() >= windowEnd) continue;
      const dtend = ev.getFirstPropertyValue('dtend');
      if (dtend instanceof ICAL.Time && dtend.toJSDate().getTime() <= windowStart) continue;
      if (!dtend && dtstart.toJSDate().getTime() < windowStart - MAX_EVENT_MINUTES * 60_000) continue;
      const event = new ICAL.Event(ev);
      if (event.endDate.toJSDate().getTime() <= windowStart) continue;
      addOccurrence(out, ev, event.startDate, event.endDate, owner);
    }

    for (const master of masters.values()) {
      if (master.startDate.isDate || master.startDate.toJSDate().getTime() >= windowEnd) continue;
      const it = master.iterator();
      let next: InstanceType<typeof ICAL.Time> | undefined;
      let guard = 0;
      while ((next = it.next()) && guard++ < MAX_ITERATIONS_PER_EVENT) {
        if (next.toJSDate().getTime() >= windowEnd) break;
        const details = master.getOccurrenceDetails(next);
        const s = details.startDate.toJSDate().getTime();
        const e = details.endDate.toJSDate().getTime();
        if (e <= windowStart || s >= windowEnd) continue;
        addOccurrence(out, details.item.component, details.startDate, details.endDate, owner);
      }
    }
  }
  return out;
}

/** Merge overlapping [start, end) intervals (sorted output). */
function mergeIntervals(intervals: [number, number][]): [number, number][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

function dayIndexMonFirst(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function emptyHeatmap(): number[][] {
  return Array.from({ length: 7 }, () => new Array<number>(HEATMAP_SLOTS).fill(0));
}

/** Spread an occurrence's minutes across hour slots (handles events crossing hours and midnight). */
function addToHeatmap(heat: number[][], start: number, end: number): void {
  let cursor = start;
  while (cursor < end) {
    const d = new Date(cursor);
    const nextHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();
    const sliceEnd = Math.min(end, nextHour);
    const slot = d.getHours() - HEATMAP_FIRST_HOUR;
    if (slot >= 0 && slot < HEATMAP_SLOTS) heat[dayIndexMonFirst(d)]![slot]! += (sliceEnd - cursor) / 60_000;
    cursor = sliceEnd;
  }
}

/**
 * Analyze one or more .ics files (a Google export zip can hold several calendars).
 * `now` is injectable for tests; defaults to the current time.
 */
export function analyzeCalendar(icsTexts: string | string[], now: Date = new Date()): CalendarSummary {
  const { start: winStart, end: winEnd } = analysisWindow(now);
  const windowStart = winStart.getTime();
  const windowEnd = winEnd.getTime();

  const all: Occurrence[] = [];
  for (const text of Array.isArray(icsTexts) ? icsTexts : [icsTexts]) {
    all.push(...collectOccurrences(text, windowStart, windowEnd));
  }

  // The same meeting can appear in more than one exported calendar.
  const seen = new Set<string>();
  const occurrences = all.filter((o) => {
    const key = `${o.start}|${o.end}|${o.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const work = occurrences.filter((o) => !o.personal);
  const personal = occurrences.filter((o) => o.personal);
  const minutesOf = (o: Occurrence) => (o.end - o.start) / 60_000;

  const categoryMinutes = Object.fromEntries(CALENDAR_CATEGORIES.map((c) => [c, 0])) as Record<CalendarCategory, number>;
  const heat = emptyHeatmap();
  for (const o of work) {
    categoryMinutes[categorize(o.title)] += minutesOf(o);
    addToHeatmap(heat, o.start, o.end);
  }

  // Per-day gap analysis. Personal events still occupy time (you can't focus at the dentist),
  // so they block focus time; fragmentation is measured between work meetings only.
  let focusBlocks = 0;
  let fragmentedMinutes = 0;
  for (let i = 0; i < WINDOW_WEEKS * 7; i++) {
    const day = new Date(winStart.getFullYear(), winStart.getMonth(), winStart.getDate() + i);
    const dayStart = day.getTime();
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
    const clip = (o: Occurrence): [number, number] | null =>
      o.end > dayStart && o.start < dayEnd ? [Math.max(o.start, dayStart), Math.min(o.end, dayEnd)] : null;

    const workToday = mergeIntervals(work.map(clip).filter((x): x is [number, number] => x !== null));
    for (let k = 1; k < workToday.length; k++) {
      const gap = (workToday[k]![0] - workToday[k - 1]![1]) / 60_000;
      if (gap > 0 && gap < FRAGMENT_MAX_MINUTES) fragmentedMinutes += gap;
    }

    const weekday = dayIndexMonFirst(day) < 5;
    if (!weekday) continue;
    const wdStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), WORKDAY_START_HOUR).getTime();
    const wdEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), WORKDAY_END_HOUR).getTime();
    const busy = mergeIntervals(
      occurrences
        .map((o): [number, number] | null =>
          o.end > wdStart && o.start < wdEnd ? [Math.max(o.start, wdStart), Math.min(o.end, wdEnd)] : null,
        )
        .filter((x): x is [number, number] => x !== null),
    );
    let cursor = wdStart;
    for (const [s, e] of [...busy, [wdEnd, wdEnd] as [number, number]]) {
      if ((s - cursor) / 60_000 >= FOCUS_MIN_MINUTES) focusBlocks++;
      cursor = Math.max(cursor, e);
    }
  }

  const perWeek = (n: number) => n / WINDOW_WEEKS;
  const meetingsPerWeek = perWeek(work.length);

  return {
    weeks: WINDOW_WEEKS,
    meetingHoursPerWeek: perWeek(work.reduce((s, o) => s + minutesOf(o), 0) / 60),
    meetingsPerWeek,
    focusBlocksPerWeek: perWeek(focusBlocks),
    fragmentedHoursPerWeek: perWeek(fragmentedMinutes / 60),
    personalHoursPerWeek: perWeek(personal.reduce((s, o) => s + minutesOf(o), 0) / 60),
    categoryHoursPerWeek: Object.fromEntries(
      CALENDAR_CATEGORIES.map((c) => [c, perWeek(categoryMinutes[c] / 60)]),
    ) as Record<CalendarCategory, number>,
    // Whole minutes keep the report URL short (decision 4).
    heatmap: heat.map((row) => row.map((m) => Math.round(perWeek(m)))),
    suggestedHours: {
      scheduling: (meetingsPerWeek * SCHEDULING_MIN_PER_MEETING) / 60,
      prepAndFollowUp: (meetingsPerWeek * PREP_MIN_PER_MEETING) / 60,
    },
  };
}
