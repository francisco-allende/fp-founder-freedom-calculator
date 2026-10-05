import { describe, expect, it } from 'vitest';
import { delegableHoursWeek } from '../engine/math';
import type { CalendarSummary } from '../engine/types';
import { STORAGE_KEYS } from '../lib/storage';
import { activeTasks, initialState, restoreState, wizardReducer, type WizardAction, type WizardState } from './wizard';

const run = (actions: WizardAction[], from: WizardState = initialState()) => actions.reduce(wizardReducer, from);

const calendar = (patch: Partial<CalendarSummary['suggestedHours']> = {}): CalendarSummary => ({
  weeks: 4,
  meetingHoursPerWeek: 12,
  meetingsPerWeek: 18,
  focusBlocksPerWeek: 3,
  fragmentedHoursPerWeek: 1.5,
  personalHoursPerWeek: 1,
  categoryHoursPerWeek: { 'Client & sales': 4, Internal: 6, Hiring: 1, Content: 0, 'Other meetings': 1 },
  heatmap: Array.from({ length: 7 }, () => new Array(17).fill(0)),
  suggestedHours: { scheduling: 3, prep: 3, followUp: 1.25, ...patch },
});

describe('wizard reducer', () => {
  it('starts with the 14 preselected tasks active (16.05 delegable hours)', () => {
    const tasks = activeTasks(initialState());
    expect(tasks).toHaveLength(14);
    expect(delegableHoursWeek(tasks)).toBeCloseTo(16.05, 10);
  });

  it('toggles, and clamps hours to 0–10 in 0.25 steps and pct to 0–100', () => {
    const s = run([
      { type: 'toggleTask', id: 'vendors' },
      { type: 'setTaskHours', id: 'vendors', hours: 12 },
      { type: 'setTaskPct', id: 'vendors', pct: 140 },
      { type: 'setTaskHours', id: 'inbox', hours: 3.1 },
      { type: 'setTaskPct', id: 'inbox', pct: Number.NaN },
    ]);
    expect(s.tasks.vendors).toEqual({ selected: true, hours: 10, pct: 100 });
    expect(s.tasks.inbox).toEqual({ selected: true, hours: 3, pct: 0 });
  });

  it('ignores unknown task ids', () => {
    const s0 = initialState();
    expect(wizardReducer(s0, { type: 'setTaskHours', id: 'nope', hours: 3 })).toBe(s0);
  });

  it('adds sanitized custom tasks with stable ids, edits and removes them', () => {
    const s = run([
      { type: 'addCustom', name: '<b>Board</b> prep', hours: 2, pct: 50 },
      { type: 'addCustom', name: '   ', hours: 2, pct: 50 }, // empty after sanitizing: ignored
      { type: 'addCustom', name: 'Investor updates', hours: 1, pct: 70 },
      { type: 'setCustom', id: 'custom-0', patch: { hours: 4 } },
      { type: 'removeCustom', id: 'custom-1' },
      { type: 'addCustom', name: 'Hiring loop', hours: 1, pct: 40 },
    ]);
    expect(s.custom).toEqual([
      { id: 'custom-0', name: 'Board prep', hours: 4, pct: 50 },
      { id: 'custom-2', name: 'Hiring loop', hours: 1, pct: 40 },
    ]);
    const custom = activeTasks(s).filter((t) => t.custom);
    expect(custom.map((t) => [t.name, t.area, t.delegablePct])).toEqual([
      ['Board prep', 'Your own tasks', 0.5],
      ['Hiring loop', 'Your own tasks', 0.4],
    ]);
  });

  it('about: sanitizes the name and clamps weekly hours and rate', () => {
    const s = run([{ type: 'setAbout', patch: { firstName: ' <i>Fran</i> ', weeklyHours: 120, rate: -5 } }]);
    expect(s.about).toMatchObject({ firstName: 'Fran', weeklyHours: 80, rate: 0 });
  });

  it('calendar suggestions are accepted one by one into their own task', () => {
    let s = run([{ type: 'setCalendar', calendar: calendar() }]);
    s = wizardReducer(s, { type: 'acceptSuggestion', kind: 'followUp' });
    expect(s.tasks.followup).toMatchObject({ selected: true, hours: 1.25 });
    expect(s.tasks.brief!.hours).toBe(1.5); // untouched default
    expect(s.accepted).toEqual({ followUp: true });

    s = wizardReducer(s, { type: 'acceptSuggestion', kind: 'prep' });
    expect(s.tasks.brief!.hours).toBe(3);
    expect(s.accepted).toEqual({ followUp: true, prep: true });
  });

  it('suggestions above the slider max are capped at 10h', () => {
    const s = run([
      { type: 'setCalendar', calendar: calendar({ scheduling: 14.2 }) },
      { type: 'acceptSuggestion', kind: 'scheduling' },
    ]);
    expect(s.tasks.sched!.hours).toBe(10);
  });

  it('accepting without a calendar does nothing', () => {
    const s0 = initialState();
    expect(wizardReducer(s0, { type: 'acceptSuggestion', kind: 'prep' })).toBe(s0);
  });
});

describe('restoreState', () => {
  it('falls back to the initial state when storage is empty or junk', () => {
    expect(restoreState()).toEqual(initialState());
    window.sessionStorage.setItem(STORAGE_KEYS.wizard, '{not json');
    expect(restoreState()).toEqual(initialState());
  });

  it('round-trips a saved state', () => {
    const s = run([
      { type: 'goTo', step: 3 },
      { type: 'setAbout', patch: { firstName: 'Fran', role: 'Founder / Owner', revenue: '$1M–$5M', timeline: 'Now' } },
      { type: 'toggleTask', id: 'ai' },
      { type: 'addCustom', name: 'Board prep', hours: 2, pct: 50 },
      { type: 'setCalendar', calendar: calendar() },
    ]);
    window.sessionStorage.setItem(STORAGE_KEYS.wizard, JSON.stringify(s));
    expect(restoreState()).toEqual(s);
  });

  it('re-validates tampered values', () => {
    const s = initialState();
    const tampered = {
      ...s,
      about: { ...s.about, role: 'Admin', firstName: '<script>x</script>Eve', rate: 'lots' },
      tasks: { ...s.tasks, inbox: { selected: true, hours: 999, pct: -4 }, evil: { selected: true, hours: 1, pct: 1 } },
      calendar: { meetingsPerWeek: 'many' },
    };
    window.sessionStorage.setItem(STORAGE_KEYS.wizard, JSON.stringify(tampered));
    const r = restoreState();
    expect(r.about.role).toBe('');
    expect(r.about.firstName).toBe('xEve');
    expect(r.about.rate).toBe(0);
    expect(r.tasks.inbox).toEqual({ selected: true, hours: 10, pct: 0 });
    expect(r.tasks.evil).toBeUndefined();
    expect(r.calendar).toBeNull();
  });
});
