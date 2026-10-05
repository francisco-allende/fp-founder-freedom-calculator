import { FlaskConical } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { Heatmap } from '../../components/Heatmap/Heatmap';
import { StepHeading } from '../../components/StepHeading/StepHeading';
import { WIZARD } from '../../data/copy';
import { TASKS_BY_ID } from '../../data/tasks';
import { formatHours } from '../../engine/format';
import type { CalendarSummary } from '../../engine/types';
import { SUGGESTION_TASK, type SuggestionKind } from '../../state/wizard';
import styles from './Step.module.css';
import local from './StepCalendar.module.css';
import type { StepProps } from './types';

type Phase = 'choice' | 'upload' | 'processing' | 'error' | 'empty';

const SUGGESTIONS: SuggestionKind[] = ['scheduling', 'prep', 'followUp'];

/** Analyze calendar text with the parser loaded on demand (keeps ical.js out of the main bundle). */
async function analyze(texts: string[]): Promise<CalendarSummary> {
  const { analyzeCalendar } = await import('../../engine/calendar');
  return analyzeCalendar(texts);
}

/** Bundled demo month. Every event recurs, so it always fills the last 4 complete weeks. */
async function loadSample(): Promise<CalendarSummary> {
  const { default: ics } = await import('../../data/sample-calendar.ics?raw');
  return analyze([ics]);
}

interface XrayProps {
  summary: CalendarSummary;
  sample?: boolean;
  accepted: Partial<Record<SuggestionKind, boolean>>;
  onAccept: (kind: SuggestionKind) => void;
}

/** The X-ray: 3 stats, heatmap and suggestions. Same view for a real calendar and the sample. */
function Xray({ summary, sample, accepted, onAccept }: XrayProps) {
  const c = WIZARD.calendar;
  return (
    <>
      <dl className={local.stats}>
        <div>
          <dt>{c.stats.meetings}</dt>
          <dd className="num">{formatHours(summary.meetingHoursPerWeek)}</dd>
        </div>
        <div>
          <dt>{c.stats.focus}</dt>
          <dd className="num">{formatHours(summary.focusBlocksPerWeek)}</dd>
        </div>
        <div>
          <dt>{c.stats.fragmented}</dt>
          <dd className="num">{formatHours(summary.fragmentedHoursPerWeek)}</dd>
        </div>
      </dl>

      <Heatmap data={summary.heatmap} caption={c.heatmapCaption} />

      <div>
        <h2 className={local.subheading}>{sample ? c.sampleSuggestionsHeading : c.suggestionsHeading}</h2>
        <ul className={styles.list}>
          {SUGGESTIONS.map((kind) => {
            const task = TASKS_BY_ID.get(SUGGESTION_TASK[kind])!;
            const hours = summary.suggestedHours[kind];
            return (
              <li key={kind} className={local.suggestion}>
                <span>
                  <strong>{task.name}</strong>
                  <span className={`num ${local.estimate}`}> about {formatHours(hours)} h a week (estimate)</span>
                </span>
                {accepted[kind] ? (
                  <span className={local.accepted} role="status">
                    {c.suggestionAccepted}
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => onAccept(kind)}
                    aria-label={`${c.suggestionAccept}: ${task.name}, ${formatHours(hours)} hours${sample ? ' (from the sample)' : ''}`}
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
    </>
  );
}

/** What the X-ray shows, before anything is loaded. Illustration only: no numbers. */
function XrayPreview() {
  const c = WIZARD.calendar;
  return (
    <figure className={local.preview}>
      <figcaption className={local.previewCaption}>{c.previewCaption}</figcaption>
      <div className={local.previewBars} aria-hidden="true">
        <span className={local.previewLabel}>{c.previewMeetings}</span>
        <span className={local.previewTrack}>
          <span className={local.barMeetings} />
        </span>
        <span className={local.previewLabel}>{c.previewFocus}</span>
        <span className={local.previewTrack}>
          <span className={local.barFocus} />
        </span>
      </div>
      <div className={local.previewGrid} aria-hidden="true">
        {Array.from({ length: 5 * 10 }, (_, k) => {
          const row = Math.floor(k / 5);
          const busy = (row >= 1 && row <= 3) || (row >= 6 && row <= 7 && k % 5 !== 2);
          return <span key={k} className={busy ? local.cellBusy : local.cellFree} />;
        })}
      </div>
      <p className={local.previewNote}>{c.previewNote}</p>
    </figure>
  );
}

export function StepCalendar({ state, dispatch, go, focusHeading }: StepProps) {
  const c = WIZARD.calendar;
  const [phase, setPhase] = useState<Phase>('choice');
  // The sample lives only here: never in wizard state, the report link or HighLevel.
  const [sample, setSample] = useState<CalendarSummary | null>(null);
  const [sampleAccepted, setSampleAccepted] = useState<Partial<Record<SuggestionKind, boolean>>>({});
  const [loadingSample, setLoadingSample] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const cal = state.calendar;

  // SPEC §4: "Skip, I'm done" has default focus.
  useEffect(() => {
    if (!cal && !sample) skipRef.current?.focus();
  }, [cal, sample]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase('processing');
    try {
      // Loaded on demand; the file never leaves this tab.
      const { readCalendarFile } = await import('../../lib/unzip');
      const summary = await analyze(await readCalendarFile(file));
      setSample(null);
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

  async function onSample() {
    setLoadingSample(true);
    try {
      setSample(await loadSample());
      setSampleAccepted({});
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <div className={styles.step}>
      <StepHeading focus={focusHeading && !!cal}>{c.heading}</StepHeading>
      <p className={styles.intro}>{c.intro}</p>
      <p className={local.privacy}>{c.privacy}</p>

      {!cal && !sample && (
        <>
          <div className={local.choices}>
            <Button onClick={() => setPhase('upload')} disabled={phase !== 'choice' && phase !== 'error' && phase !== 'empty'}>
              {c.add}
            </Button>
            <Button ref={skipRef} variant="secondary" onClick={() => go(4)}>
              {c.skip}
            </Button>
            <Button variant="quiet" onClick={onSample} disabled={loadingSample}>
              <FlaskConical size={18} strokeWidth={1.5} aria-hidden="true" />
              {c.sample}
            </Button>
          </div>
          {phase === 'choice' && <XrayPreview />}
        </>
      )}

      {!cal && !sample && phase !== 'choice' && (
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

      {!cal && sample && (
        <section className={`${local.result} ${local.sample}`} aria-label="Sample calendar X-ray">
          <p className={local.badge}>
            <FlaskConical size={16} strokeWidth={1.5} aria-hidden="true" />
            {c.sampleBadge}
          </p>
          <p className={local.sampleNote}>{c.sampleNote}</p>
          <Xray
            summary={sample}
            sample
            accepted={sampleAccepted}
            onAccept={(kind) => {
              dispatch({ type: 'applySuggestion', kind, hours: sample.suggestedHours[kind] });
              setSampleAccepted((prev) => ({ ...prev, [kind]: true }));
            }}
          />
          <div className={styles.nav}>
            <Button onClick={() => go(4)}>{c.continue}</Button>
            <Button variant="secondary" onClick={() => setSample(null)}>
              {c.sampleClose}
            </Button>
          </div>
        </section>
      )}

      {cal && (
        <section className={local.result} aria-label="Your calendar X-ray">
          <Xray summary={cal} accepted={state.accepted} onAccept={(kind) => dispatch({ type: 'acceptSuggestion', kind })} />
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
