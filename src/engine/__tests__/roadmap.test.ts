import { describe, expect, it } from 'vitest';
import { defaultTasks, TASKS, TASKS_BY_ID, taskFromDef } from '../../data/tasks';
import { delegableHoursWeek, taskDelegableHours } from '../math';
import { buildRoadmap, priority, SETUP_ITEM_TEXT, taskMap, type Roadmap } from '../roadmap';
import type { Ease, TaskInput } from '../types';

const lib = (id: string, hours?: number, pct?: number) => taskFromDef(TASKS_BY_ID.get(id)!, hours, pct);

const make = (id: string, hours: number, pct: number, ease: Ease, needsApproval = false): TaskInput => ({
  id,
  name: id,
  area: 'Inbox & calendar',
  hoursPerWeek: hours,
  delegablePct: pct,
  ease,
  needsApproval,
  tip: `tip for ${id}`,
});

const taskItems = (r: Roadmap) => [...r.weeks1to2, ...r.month1, ...r.months2to3].filter((i) => i.kind === 'task');

/** Deterministic pseudo-random generator so failures are reproducible. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
}

function randomTaskSet(seed: number): TaskInput[] {
  const r = rng(seed);
  return TASKS.filter(() => r() < 0.7).map((t) =>
    taskFromDef(t, Math.round(r() * 40) / 4, Math.round(r() * 100) / 100),
  );
}

describe('test 5: roadmap', () => {
  it('priority = hours × pct × ease', () => {
    expect(priority(lib('inbox'))).toBeCloseTo(5 * 0.7 * 3, 10);
  });

  it('approval tasks never land in Weeks 1–2 (defaults, full library, 200 random sets)', () => {
    const sets = [defaultTasks(), TASKS.map((t) => taskFromDef(t))];
    for (let seed = 1; seed <= 200; seed++) sets.push(randomTaskSet(seed));
    for (const tasks of sets) {
      expect(buildRoadmap(tasks).weeks1to2.some((i) => i.needsApproval)).toBe(false);
    }
  });

  it('buckets cover 100% of delegable hours, each task exactly once', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = randomTaskSet(seed);
      const roadmap = buildRoadmap(tasks);
      const items = taskItems(roadmap);
      const expectedIds = tasks.filter((t) => taskDelegableHours(t) > 0).map((t) => t.id);
      expect(items.map((i) => i.taskId).sort()).toEqual([...expectedIds].sort());
      expect(items.reduce((s, i) => s + i.hours, 0)).toBeCloseTo(delegableHoursWeek(tasks), 9);
      expect(roadmap.totalHours).toBeCloseTo(delegableHoursWeek(tasks), 9);
    }
  });

  it('Weeks 1–2 reaches 40% with quick wins only, Month 1 reaches 75%', () => {
    const roadmap = buildRoadmap(defaultTasks());
    const total = roadmap.totalHours;
    const w = roadmap.weeks1to2.reduce((s, i) => s + i.hours, 0);
    const m = roadmap.month1.reduce((s, i) => s + i.hours, 0);
    expect(roadmap.phase1Source).toBe('rule');
    expect(w).toBeGreaterThanOrEqual(total * 0.4);
    expect(w + m).toBeGreaterThanOrEqual(total * 0.75);
    for (const item of roadmap.weeks1to2) expect(TASKS_BY_ID.get(item.taskId)!.ease).toBeGreaterThanOrEqual(2);
  });

  it('defaults: highest-priority quick win comes first and every item carries its tip', () => {
    const roadmap = buildRoadmap(defaultTasks());
    expect(roadmap.weeks1to2[0]!.taskId).toBe('inbox');
    for (const item of taskItems(roadmap)) expect(item.tip).toBe(TASKS_BY_ID.get(item.taskId)!.tip);
  });

  it('stable ordering on ties: equal priority keeps input order', () => {
    const tied = ['a', 'b', 'c', 'd', 'e'].map((id) => make(id, 2, 0.5, 2));
    const ids = (r: Roadmap) => taskItems(r).map((i) => i.taskId);
    expect(ids(buildRoadmap(tied))).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(ids(buildRoadmap([...tied].reverse()))).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  it('ineligible tasks are skipped in Weeks 1–2 but keep their rank for Month 1', () => {
    const tasks = [make('hard', 10, 1, 1), make('money', 8, 1, 3, true), make('easy', 2, 1, 3), make('easy2', 2, 1, 2)];
    const r = buildRoadmap(tasks);
    expect(r.weeks1to2.map((i) => i.taskId)).toEqual(['easy', 'easy2']);
    expect(r.month1[0]!.taskId).toBe('money'); // priority 24 > hard's 10
  });

  it('fallback 1: no quick win → promote the highest-priority task that does not need approval', () => {
    const tasks = [make('money', 8, 1, 3, true), make('hardSmall', 1, 1, 1), make('hardBig', 4, 1, 1)];
    const r = buildRoadmap(tasks);
    expect(r.phase1Source).toBe('promoted');
    expect(r.weeks1to2.map((i) => i.taskId)).toEqual(['hardBig']);
    expect(taskItems(r)).toHaveLength(3);
    expect(r.weeks1to2.some((i) => i.needsApproval)).toBe(false);
  });

  it('fallback 2: every task needs approval → single setup item', () => {
    const tasks = [make('invoices', 2, 0.8, 3, true), make('payroll', 1, 0.5, 1, true)];
    const r = buildRoadmap(tasks);
    expect(r.phase1Source).toBe('setup');
    expect(r.weeks1to2).toHaveLength(1);
    expect(r.weeks1to2[0]).toMatchObject({ kind: 'setup', name: SETUP_ITEM_TEXT, hours: 0 });
    // The approval tasks still land in the plan.
    expect(taskItems(r).map((i) => i.taskId).sort()).toEqual(['invoices', 'payroll']);
  });

  it('tasks with 0 delegable hours are left out of the roadmap', () => {
    const r = buildRoadmap([make('zeroH', 0, 1, 3), make('zeroP', 3, 0, 3), make('real', 2, 1, 3)]);
    expect(taskItems(r).map((i) => i.taskId)).toEqual(['real']);
  });
});

describe('task map', () => {
  it('Keep if pct < 50% or hours = 0; approval tasks go to their own column', () => {
    const map = taskMap([
      make('keepPct', 3, 0.49, 2),
      make('keepZero', 0, 0.9, 2),
      make('handoff', 2, 0.5, 2),
      make('appr', 1, 0.8, 2, true),
      make('apprLow', 1, 0.3, 2, true),
    ]);
    expect(map.keep.map((t) => t.id)).toEqual(['keepPct', 'keepZero', 'apprLow']);
    expect(map.handOff.map((t) => t.id)).toEqual(['handoff']);
    expect(map.handOffWithApproval.map((t) => t.id)).toEqual(['appr']);
  });
});
