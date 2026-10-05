import { clampPct, nonNeg, taskDelegableHours } from './math';
import type { TaskInput } from './types';

// SPEC §5.4.

export const SETUP_ITEM_TEXT =
  'Give your Right Hand read-only access and a 15-minute walkthrough of your top task.';

const QUICK_WIN_SHARE = 0.4;
const MONTH_1_SHARE = 0.75;
const EPS = 1e-9;

export interface RoadmapItem {
  kind: 'task' | 'setup';
  /** Empty for the setup item. */
  taskId: string;
  name: string;
  /** Delegable hours/week this item hands off (0 for the setup item). */
  hours: number;
  priority: number;
  needsApproval: boolean;
  tip: string;
}

export interface Roadmap {
  weeks1to2: RoadmapItem[];
  month1: RoadmapItem[];
  months2to3: RoadmapItem[];
  /** How Weeks 1–2 was filled: by the normal rule, a promoted task, or the setup item. */
  phase1Source: 'rule' | 'promoted' | 'setup';
  totalHours: number;
}

export function priority(task: TaskInput): number {
  return taskDelegableHours(task) * task.ease;
}

function toItem(task: TaskInput): RoadmapItem {
  return {
    kind: 'task',
    taskId: task.id,
    name: task.name,
    hours: taskDelegableHours(task),
    priority: priority(task),
    needsApproval: task.needsApproval,
    tip: task.tip,
  };
}

const SETUP_ITEM: RoadmapItem = {
  kind: 'setup',
  taskId: '',
  name: SETUP_ITEM_TEXT,
  hours: 0,
  priority: 0,
  needsApproval: false,
  tip: SETUP_ITEM_TEXT,
};

/** Day 3 rule: money/irreversible actions are never quick wins. */
function isQuickWin(task: TaskInput): boolean {
  return task.ease >= 2 && !task.needsApproval;
}

export function buildRoadmap(tasks: readonly TaskInput[]): Roadmap {
  // Array.prototype.sort is stable, so ties keep the input (library) order.
  const ranked = tasks
    .filter((t) => taskDelegableHours(t) > 0)
    .map((task) => ({ task, item: toItem(task) }))
    .sort((a, b) => b.item.priority - a.item.priority);

  const totalHours = ranked.reduce((s, r) => s + r.item.hours, 0);
  const placed = new Set<RoadmapItem>();
  let cumulative = 0;

  // Weeks 1–2: quick wins only, until ≥ 40% of total.
  const weeks1to2: RoadmapItem[] = [];
  for (const { task, item } of ranked) {
    if (cumulative >= totalHours * QUICK_WIN_SHARE - EPS) break;
    if (!isQuickWin(task)) continue;
    weeks1to2.push(item);
    placed.add(item);
    cumulative += item.hours;
  }

  // Weeks 1–2 is never empty.
  let phase1Source: Roadmap['phase1Source'] = 'rule';
  if (weeks1to2.length === 0) {
    const promoted = ranked.find((r) => !r.item.needsApproval);
    if (promoted) {
      phase1Source = 'promoted';
      weeks1to2.push(promoted.item);
      placed.add(promoted.item);
      cumulative += promoted.item.hours;
    } else {
      phase1Source = 'setup';
      weeks1to2.push({ ...SETUP_ITEM });
    }
  }

  // Month 1: next tasks in priority order until ≥ 75%. Months 2–3: the rest.
  const month1: RoadmapItem[] = [];
  const months2to3: RoadmapItem[] = [];
  for (const { item } of ranked) {
    if (placed.has(item)) continue;
    if (cumulative < totalHours * MONTH_1_SHARE - EPS) {
      month1.push(item);
      cumulative += item.hours;
    } else {
      months2to3.push(item);
    }
  }

  return { weeks1to2, month1, months2to3, phase1Source, totalHours };
}

export type TaskMapBucket = 'keep' | 'handOff' | 'handOffWithApproval';

export function taskMapBucket(task: TaskInput): TaskMapBucket {
  if (nonNeg(task.hoursPerWeek) === 0 || clampPct(task.delegablePct) < 0.5) return 'keep';
  return task.needsApproval ? 'handOffWithApproval' : 'handOff';
}

export function taskMap(tasks: readonly TaskInput[]): Record<TaskMapBucket, TaskInput[]> {
  const map: Record<TaskMapBucket, TaskInput[]> = { keep: [], handOff: [], handOffWithApproval: [] };
  for (const t of tasks) map[taskMapBucket(t)].push(t);
  return map;
}
