import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { RateHelper } from '../../components/RateHelper/RateHelper';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { WIZARD } from '../../data/copy';
import { REVENUE_BANDS, ROLES, TIMELINES } from '../../data/options';
import { MAX_NAME_LENGTH } from '../../engine/constants';
import { aboutComplete, WEEKLY_HOURS, type About } from '../../state/wizard';
import styles from './Step.module.css';
import type { StepProps } from './types';

function Chips({
  legend,
  name,
  options,
  value,
  error,
  onChange,
}: {
  legend: string;
  name: keyof About;
  options: readonly string[];
  value: string;
  error: boolean;
  onChange: (v: string) => void;
}) {
  const errorId = useId();
  return (
    <fieldset className={styles.field} aria-describedby={error ? errorId : undefined} data-field={name}>
      <legend>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option} className={styles.chip}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {WIZARD.about.required}
        </p>
      )}
    </fieldset>
  );
}

export function StepAbout({ state, dispatch, go, focusHeading }: StepProps) {
  const a = WIZARD.about;
  const { about } = state;
  const [showErrors, setShowErrors] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<About>) => dispatch({ type: 'setAbout', patch });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!aboutComplete(about)) {
      setShowErrors(true);
      const firstMissing = (['role', 'revenue', 'timeline'] as const).find((k) => !about[k]);
      formRef.current?.querySelector<HTMLInputElement>(`[data-field="${firstMissing}"] input`)?.focus();
      return;
    }
    go(2);
  }

  return (
    <form ref={formRef} className={styles.step} onSubmit={submit} noValidate>
      <StepHeading focus={focusHeading}>{a.heading}</StepHeading>
      <p className={styles.intro}>{a.intro}</p>

      <div className={styles.field}>
        <label htmlFor="firstName">{a.firstName}</label>
        <input
          id="firstName"
          className={styles.text}
          autoComplete="given-name"
          maxLength={MAX_NAME_LENGTH}
          value={about.firstName}
          aria-describedby="firstName-hint"
          onChange={(e) => set({ firstName: e.target.value })}
        />
        <p id="firstName-hint" className={styles.hint}>
          {a.firstNameHint}
        </p>
      </div>

      <Chips legend={a.role} name="role" options={ROLES} value={about.role} error={showErrors && !about.role} onChange={(role) => set({ role })} />
      <Chips
        legend={a.revenue}
        name="revenue"
        options={REVENUE_BANDS.map((b) => b.label)}
        value={about.revenue}
        error={showErrors && !about.revenue}
        onChange={(revenue) => set({ revenue })}
      />
      <Chips
        legend={a.timeline}
        name="timeline"
        options={TIMELINES}
        value={about.timeline}
        error={showErrors && !about.timeline}
        onChange={(timeline) => set({ timeline })}
      />

      <div className={styles.field}>
        <label htmlFor="weeklyHours">{a.weeklyHours}</label>
        <div className={styles.rangeRow}>
          <input
            id="weeklyHours"
            type="range"
            min={WEEKLY_HOURS.min}
            max={WEEKLY_HOURS.max}
            step={1}
            value={about.weeklyHours}
            aria-valuetext={`${about.weeklyHours} hours`}
            onChange={(e) => set({ weeklyHours: Number(e.target.value) })}
          />
          <span className="num" aria-hidden="true">
            {about.weeklyHours} h
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="rate">{a.rate}</label>
        <div className={styles.money}>
          <span aria-hidden="true">$</span>
          <input
            id="rate"
            className={styles.text}
            type="number"
            inputMode="numeric"
            min={0}
            step={10}
            value={about.rate}
            aria-describedby="rate-hint"
            onChange={(e) => set({ rate: Number(e.target.value) })}
          />
          <span className={styles.hint}>per hour</span>
        </div>
        <p id="rate-hint" className={styles.hint}>
          {a.rateHint}
        </p>
        <RateHelper weeklyHours={about.weeklyHours} onUse={(rate) => set({ rate })} />
      </div>

      <div className={styles.nav}>
        <Button type="submit">{WIZARD.nav.toTasks}</Button>
      </div>
    </form>
  );
}
