import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { Heatmap } from '../../components/Heatmap/Heatmap';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { WIZARD } from '../../data/copy';
import { TASKS_BY_ID } from '../../data/tasks';
import { formatHours } from '../../engine/format';
import { SUGGESTION_TASK, type SuggestionKind } from '../../state/wizard';
import styles from './Step.module.css';
import local from './StepCalendar.module.css';
import type { StepProps } from './types';

type Phase = 'choice' | 'upload' | 'processing' | 'error' | 'empty';

const SUGGESTIONS: SuggestionKind[] = ['scheduling', 'prep', 'followUp'];

export function StepCalendar({ state, dispatch, go, focusHeading }: StepProps) {
  const c = WIZARD.calendar;
  const [phase, setPhase] = useState<Phase>('choice');
  const skipRef = useRef<HTMLButtonElement>(null);

  // SPEC §4: "Skip, I'm done" has default focus.
  useEffect(() => {
    if (!state.calendar) skipRef.current?.focus();
  }, [state.calendar]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase('processing');
    try {
      // Loaded on demand; the file never leaves this tab.
      const [{ readCalendarFile }, { analyzeCalendar }] = await Promise.all([
        import('../../lib/unzip'),
        import('../../engine/calendar'),
      ]);
      const summary = analyzeCalendar(await readCalendarFile(file));
      if (summary.meetingsPerWeek === 0) {
        dispatch({ type: 'setCalendar', calendar: null });
        setPhase('empty');
      } else {
        dispatch({ type: 'setCalendar', calendar: summary });
      }
    } catch {
      setPhase('error');
    } finally {
      e.target.value = '';
    }
  }

  const cal = state.calendar;

  return (
    <div className={styles.step}>
      <StepHeading focus={focusHeading && !!cal}>{c.heading}</StepHeading>
      <p className={styles.intro}>{c.intro}</p>
      <p className={local.privacy}>{c.privacy}</p>

      {!cal && (
        <div className={styles.nav}>
          <Button ref={skipRef} onClick={() => go(4)}>
            {c.skip}
          </Button>
          {phase === 'choice' && (
            <Button variant="secondary" onClick={() => setPhase('upload')}>
              {c.add}
            </Button>
          )}
        </div>
      )}

      {!cal && phase !== 'choice' && (
        <section className={local.upload} aria-labelledby="calendar-how">
          <h2 id="calendar-how" className="visually-hidden">
            How to export your calendar
          </h2>
          <div className={local.guides}>
            {[c.google, c.outlook].map((g) => (
              <div key={g.title}>
                <h3>{g.title}</h3>
                <ol className={local.steps}>
                  {g.steps.map((s) => (
                    <li key={s}>
                      {s}
                      <span className={local.shot} aria-hidden="true" />
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className={styles.field}>
            <label htmlFor="calendar-file">{c.fileLabel}</label>
            <input
              id="calendar-file"
              className={local.file}
              type="file"
              accept=".ics,.zip,text/calendar,application/zip"
              onChange={onFile}
              disabled={phase === 'processing'}
            />
          </div>
          <p role="status" className={phase === 'error' ? styles.error : styles.hint}>
            {phase === 'processing' ? c.processing : phase === 'error' ? c.error : phase === 'empty' ? c.empty : ''}
          </p>
        </section>
      )}

      {cal && (
        <section className={local.result} aria-label="Your calendar X-ray">
          <dl className={local.stats}>
            <div>
              <dt>{c.stats.meetings}</dt>
              <dd className="num">{formatHours(cal.meetingHoursPerWeek)}</dd>
            </div>
            <div>
              <dt>{c.stats.focus}</dt>
              <dd className="num">{formatHours(cal.focusBlocksPerWeek)}</dd>
            </div>
            <div>
              <dt>{c.stats.fragmented}</dt>
              <dd className="num">{formatHours(cal.fragmentedHoursPerWeek)}</dd>
            </div>
          </dl>

          <Heatmap data={cal.heatmap} caption={c.heatmapCaption} />

          <div>
            <h2 className={local.subheading}>{c.suggestionsHeading}</h2>
            <ul className={styles.list}>
              {SUGGESTIONS.map((kind) => {
                const task = TASKS_BY_ID.get(SUGGESTION_TASK[kind])!;
                const hours = cal.suggestedHours[kind];
                const accepted = state.accepted[kind];
                return (
                  <li key={kind} className={local.suggestion}>
                    <span>
                      <strong>{task.name}</strong>
                      <span className={`num ${local.estimate}`}>
                        {' '}
                        about {formatHours(hours)} h a week (estimate)
                      </span>
                    </span>
                    {accepted ? (
                      <span className={local.accepted} role="status">
                        {c.suggestionAccepted}
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => dispatch({ type: 'acceptSuggestion', kind })}
                        aria-label={`${c.suggestionAccept}: ${task.name}, ${formatHours(hours)} hours`}
                        disabled={hours <= 0}
                      >
                        {c.suggestionAccept}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.nav}>
            <Button onClick={() => go(4)}>{c.continue}</Button>
            <Button
              variant="quiet"
              onClick={() => {
                dispatch({ type: 'setCalendar', calendar: null });
                setPhase('upload');
              }}
            >
              Use a different file
            </Button>
          </div>
        </section>
      )}

      <div className={styles.nav}>
        <Button variant="quiet" onClick={() => go(2)}>
          {WIZARD.nav.back}
        </Button>
      </div>
    </div>
  );
}
