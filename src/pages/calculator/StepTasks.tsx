import { useMemo, useState } from 'react';
import { AddTask } from '../../components/AddTask/AddTask';
import { Button } from '../../components/Button/Button';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { TaskRow } from '../../components/TaskRow/TaskRow';
import { WIZARD } from '../../data/copy';
import { TASKS } from '../../data/tasks';
import { hoursByArea, workloadNotice } from '../../engine/math';
import { LIBRARY_AREAS, type Area } from '../../engine/types';
import { AreaCard } from './AreaCard';
import styles from './Step.module.css';
import type { StepProps } from './types';

const CUSTOM: Area = 'Your own tasks';

export function StepTasks({ state, dispatch, tasks, results, go, focusHeading }: StepProps) {
  const t = WIZARD.tasks;
  const notice = workloadNotice(results.totalHours, state.about.weeklyHours);

  // First area open, the rest collapsed; the custom card opens as soon as it exists.
  const [open, setOpen] = useState<Set<Area>>(() => new Set<Area>([LIBRARY_AREAS[0], CUSTOM]));
  const toggle = (area: Area) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });

  // Live subtotals from the same engine function the report uses.
  const subtotals = useMemo(() => new Map(hoursByArea(tasks).map((a) => [a.area, a.delegable])), [tasks]);

  return (
    <div className={styles.step}>
      <StepHeading focus={focusHeading}>{t.heading}</StepHeading>
      <p className={styles.intro}>{t.intro}</p>
      <p className={styles.footnote}>{t.estimate}</p>

      <div className={styles.areas}>
        {LIBRARY_AREAS.map((area) => {
          const defs = TASKS.filter((d) => d.area === area);
          return (
            <AreaCard
              key={area}
              area={area}
              open={open.has(area)}
              onToggle={() => toggle(area)}
              subtotal={subtotals.get(area) ?? 0}
              selected={defs.filter((d) => state.tasks[d.id]?.selected).length}
              total={defs.length}
            >
              <ul className={styles.list}>
                {defs.map((def) => {
                  const s = state.tasks[def.id]!;
                  return (
                    <TaskRow
                      key={def.id}
                      name={def.name}
                      hours={s.hours}
                      pct={s.pct}
                      needsApproval={def.appr}
                      selected={s.selected}
                      onToggle={() => dispatch({ type: 'toggleTask', id: def.id })}
                      onHours={(hours) => dispatch({ type: 'setTaskHours', id: def.id, hours })}
                      onPct={(pct) => dispatch({ type: 'setTaskPct', id: def.id, pct })}
                    />
                  );
                })}
              </ul>
            </AreaCard>
          );
        })}

        {state.custom.length > 0 && (
          <AreaCard
            area={CUSTOM}
            open={open.has(CUSTOM)}
            onToggle={() => toggle(CUSTOM)}
            subtotal={subtotals.get(CUSTOM) ?? 0}
            selected={state.custom.length}
            total={state.custom.length}
          >
            <ul className={styles.list}>
              {state.custom.map((c) => (
                <TaskRow
                  key={c.id}
                  name={c.name}
                  hours={c.hours}
                  pct={c.pct}
                  onRemove={() => dispatch({ type: 'removeCustom', id: c.id })}
                  onHours={(hours) => dispatch({ type: 'setCustom', id: c.id, patch: { hours } })}
                  onPct={(pct) => dispatch({ type: 'setCustom', id: c.id, patch: { pct } })}
                />
              ))}
            </ul>
          </AreaCard>
        )}
      </div>

      <AddTask onAdd={(name) => dispatch({ type: 'addCustom', name, hours: 1, pct: 50 })} />

      {notice && (
        <p className={styles.notice} role="status">
          {notice === 'over' ? t.noticeOver : t.noticeHigh}
        </p>
      )}

      <div className={styles.nav}>
        <Button onClick={() => go(3)}>{WIZARD.nav.toCalendar}</Button>
        <Button variant="quiet" onClick={() => go(1)}>
          {WIZARD.nav.back}
        </Button>
      </div>
    </div>
  );
}
