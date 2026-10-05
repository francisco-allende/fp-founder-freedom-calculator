import { AddTask } from '../../components/AddTask/AddTask';
import { AreaIcon } from '../../components/AreaIcon/AreaIcon';
import { Button } from '../../components/Button/Button';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { TaskRow } from '../../components/TaskRow/TaskRow';
import { WIZARD } from '../../data/copy';
import { TASKS } from '../../data/tasks';
import { workloadNotice } from '../../engine/math';
import { LIBRARY_AREAS } from '../../engine/types';
import styles from './Step.module.css';
import type { StepProps } from './types';

export function StepTasks({ state, dispatch, results, go, focusHeading }: StepProps) {
  const t = WIZARD.tasks;
  const notice = workloadNotice(results.totalHours, state.about.weeklyHours);

  return (
    <div className={styles.step}>
      <StepHeading focus={focusHeading}>{t.heading}</StepHeading>
      <p className={styles.intro}>{t.intro}</p>
      <p className={styles.footnote}>{t.estimate}</p>

      <div className={styles.areas}>
        {LIBRARY_AREAS.map((area, i) => (
          <section key={area} className={styles.area} aria-labelledby={`area-${i}`}>
            <h2 id={`area-${i}`} className={styles.areaHeading}>
              <AreaIcon area={area} />
              {area}
            </h2>
            <ul className={styles.list}>
              {TASKS.filter((d) => d.area === area).map((def) => {
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
          </section>
        ))}

        {state.custom.length > 0 && (
          <section className={styles.area} aria-labelledby="area-custom">
            <h2 id="area-custom" className={styles.areaHeading}>
              <AreaIcon area="Your own tasks" />
              Your own tasks
            </h2>
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
          </section>
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
