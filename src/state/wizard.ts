import { useEffect, useReducer } from 'react';
import { REVENUE_BANDS, ROLES, TIMELINES } from '../data/options';
import { CUSTOM_TASK_TIP, TASKS, taskFromDef } from '../data/tasks';
import { DEFAULT_RATE } from '../engine/constants';
import { sanitizeName } from '../engine/sanitize';
import type { CalendarSummary, TaskInput } from '../engine/types';
import { isRecord, readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';

// Wizard state (SPEC §4). The reducer is pure; persistence lives in useWizard().

export type Step = 1 | 2 | 3 | 4;
export const MAX_TASK_HOURS = 10;
export const HOURS_STEP = 0.25;
export const WEEKLY_HOURS = { min: 30, max: 80, default: 55 } as const;

export interface About {
  firstName: string;
  role: string;
  revenue: string;
  timeline: string;
  weeklyHours: number;
  rate: number;
}

export interface TaskSetting {
  selected: boolean;
  hours: number;
  /** Whole percent 0–100. */
  pct: number;
}

export interface CustomTaskSetting {
  id: string;
  name: string;
  hours: number;
  pct: number;
}

/** Calendar suggestions map onto these library tasks (SPEC §5.3). */
export const SUGGESTION_TASK = { scheduling: 'sched', prep: 'brief', followUp: 'followup' } as const;
export type SuggestionKind = keyof typeof SUGGESTION_TASK;

export interface WizardState {
  v: 1;
  step: Step;
  about: About;
  tasks: Record<string, TaskSetting>;
  custom: CustomTaskSetting[];
  nextCustomId: number;
  calendar: CalendarSummary | null;
  accepted: Partial<Record<SuggestionKind, boolean>>;
}

export type WizardAction =
  | { type: 'goTo'; step: Step }
  | { type: 'setAbout'; patch: Partial<About> }
  | { type: 'toggleTask'; id: string }
  | { type: 'setTaskHours'; id: string; hours: number }
  | { type: 'setTaskPct'; id: string; pct: number }
  | { type: 'addCustom'; name: string; hours: number; pct: number }
  | { type: 'setCustom'; id: string; patch: Partial<Omit<CustomTaskSetting, 'id'>> }
  | { type: 'removeCustom'; id: string }
  | { type: 'setCalendar'; calendar: CalendarSummary | null }
  | { type: 'acceptSuggestion'; kind: SuggestionKind }
  | { type: 'reset' };

export const clampHours = (h: number): number =>
  Number.isFinite(h) ? Math.round(Math.min(MAX_TASK_HOURS, Math.max(0, h)) / HOURS_STEP) * HOURS_STEP : 0;
export const clampPct = (p: number): number => (Number.isFinite(p) ? Math.round(Math.min(100, Math.max(0, p))) : 0);
const clampWeekly = (h: number): number =>
  Number.isFinite(h) ? Math.round(Math.min(WEEKLY_HOURS.max, Math.max(WEEKLY_HOURS.min, h))) : WEEKLY_HOURS.default;
const clampRate = (r: number): number => (Number.isFinite(r) ? Math.min(100_000, Math.max(0, r)) : 0);

export function initialState(): WizardState {
  return {
    v: 1,
    step: 1,
    about: { firstName: '', role: '', revenue: '', timeline: '', weeklyHours: WEEKLY_HOURS.default, rate: DEFAULT_RATE },
    tasks: Object.fromEntries(
      TASKS.map((t) => [t.id, { selected: t.pre, hours: t.defaultHours, pct: Math.round(t.defaultPct * 100) }]),
    ),
    custom: [],
    nextCustomId: 0,
    calendar: null,
    accepted: {},
  };
}

function updateTask(state: WizardState, id: string, patch: Partial<TaskSetting>): WizardState {
  const current = state.tasks[id];
  if (!current) return state;
  return { ...state, tasks: { ...state.tasks, [id]: { ...current, ...patch } } };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'goTo':
      return { ...state, step: action.step };

    case 'setAbout': {
      const p = action.patch;
      return {
        ...state,
        about: {
          ...state.about,
          ...p,
          ...(p.firstName !== undefined ? { firstName: sanitizeName(p.firstName) } : {}),
          ...(p.weeklyHours !== undefined ? { weeklyHours: clampWeekly(p.weeklyHours) } : {}),
          ...(p.rate !== undefined ? { rate: clampRate(p.rate) } : {}),
        },
      };
    }

    case 'toggleTask': {
      const t = state.tasks[action.id];
      return t ? updateTask(state, action.id, { selected: !t.selected }) : state;
    }

    case 'setTaskHours':
      return updateTask(state, action.id, { hours: clampHours(action.hours) });

    case 'setTaskPct':
      return updateTask(state, action.id, { pct: clampPct(action.pct) });

    case 'addCustom': {
      const name = sanitizeName(action.name);
      if (!name) return state;
      const id = `custom-${state.nextCustomId}`;
      return {
        ...state,
        custom: [...state.custom, { id, name, hours: clampHours(action.hours), pct: clampPct(action.pct) }],
        nextCustomId: state.nextCustomId + 1,
      };
    }

    case 'setCustom':
      return {
        ...state,
        custom: state.custom.map((c) =>
          c.id !== action.id
            ? c
            : {
                ...c,
                ...(action.patch.name !== undefined ? { name: sanitizeName(action.patch.name) || c.name } : {}),
                ...(action.patch.hours !== undefined ? { hours: clampHours(action.patch.hours) } : {}),
                ...(action.patch.pct !== undefined ? { pct: clampPct(action.patch.pct) } : {}),
              },
        ),
      };

    case 'removeCustom':
      return { ...state, custom: state.custom.filter((c) => c.id !== action.id) };

    case 'setCalendar':
      return { ...state, calendar: action.calendar, accepted: {} };

    case 'acceptSuggestion': {
      if (!state.calendar) return state;
      const id = SUGGESTION_TASK[action.kind];
      const next = updateTask(state, id, { selected: true, hours: clampHours(state.calendar.suggestedHours[action.kind]) });
      return { ...next, accepted: { ...next.accepted, [action.kind]: true } };
    }

    case 'reset':
      return initialState();
  }
}

/** The tasks the engine sees: selected library tasks, in library order, then custom tasks. */
export function activeTasks(state: WizardState): TaskInput[] {
  const library = TASKS.flatMap((def) => {
    const s = state.tasks[def.id];
    return s?.selected ? [taskFromDef(def, s.hours, s.pct / 100)] : [];
  });
  const custom: TaskInput[] = state.custom.map((c) => ({
    id: c.id,
    name: c.name,
    area: 'Your own tasks',
    hoursPerWeek: c.hours,
    delegablePct: c.pct / 100,
    ease: 2,
    needsApproval: false,
    tip: CUSTOM_TASK_TIP,
    custom: true,
  }));
  return [...library, ...custom];
}

export function aboutComplete(about: About): boolean {
  return Boolean(about.role && about.revenue && about.timeline);
}

// ---- persistence ----

function isCalendarSummary(x: unknown): x is CalendarSummary {
  return (
    isRecord(x) &&
    typeof x.meetingHoursPerWeek === 'number' &&
    typeof x.meetingsPerWeek === 'number' &&
    typeof x.focusBlocksPerWeek === 'number' &&
    typeof x.fragmentedHoursPerWeek === 'number' &&
    isRecord(x.categoryHoursPerWeek) &&
    isRecord(x.suggestedHours) &&
    Array.isArray(x.heatmap) &&
    x.heatmap.length === 7 &&
    x.heatmap.every((row) => Array.isArray(row) && row.length === 17 && row.every((m) => typeof m === 'number'))
  );
}

function isWizardState(x: unknown): x is WizardState {
  return (
    isRecord(x) &&
    x.v === 1 &&
    [1, 2, 3, 4].includes(x.step as number) &&
    isRecord(x.about) &&
    isRecord(x.tasks) &&
    Array.isArray(x.custom)
  );
}

/** Restore from sessionStorage, re-running every value through the reducer's clamps. */
export function restoreState(): WizardState {
  const saved = readJSON(STORAGE_KEYS.wizard, isWizardState);
  if (!saved) return initialState();
  const base = initialState();
  const a = saved.about as unknown as Record<string, unknown>;
  const oneOf = (value: unknown, options: readonly string[]) =>
    typeof value === 'string' && options.includes(value) ? value : '';
  let state: WizardState = {
    ...base,
    step: saved.step,
    calendar: isCalendarSummary(saved.calendar) ? saved.calendar : null,
    accepted: isRecord(saved.accepted) ? (saved.accepted as WizardState['accepted']) : {},
  };
  state = wizardReducer(state, {
    type: 'setAbout',
    patch: {
      firstName: typeof a.firstName === 'string' ? a.firstName : '',
      role: oneOf(a.role, ROLES),
      revenue: oneOf(a.revenue, REVENUE_BANDS.map((b) => b.label)),
      timeline: oneOf(a.timeline, TIMELINES),
      weeklyHours: Number(a.weeklyHours),
      rate: Number(a.rate),
    },
  });
  for (const [id, s] of Object.entries(saved.tasks)) {
    if (!state.tasks[id] || !isRecord(s)) continue;
    state = updateTask(state, id, {
      selected: Boolean(s.selected),
      hours: clampHours(Number(s.hours)),
      pct: clampPct(Number(s.pct)),
    });
  }
  for (const c of saved.custom) {
    if (isRecord(c)) state = wizardReducer(state, { type: 'addCustom', name: String(c.name), hours: Number(c.hours), pct: Number(c.pct) });
  }
  return state;
}

export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, undefined, restoreState);
  useEffect(() => writeJSON(STORAGE_KEYS.wizard, state), [state]);
  return [state, dispatch] as const;
}

/**
 * From the landing mini-calculator: start a fresh run with the email hours already set.
 * A run in progress is never overwritten.
 */
export function seedNewRun(inboxHours: number): void {
  if (readJSON(STORAGE_KEYS.wizard, isWizardState)) return;
  writeJSON(STORAGE_KEYS.wizard, wizardReducer(initialState(), { type: 'setTaskHours', id: 'inbox', hours: inboxHours }));
}
