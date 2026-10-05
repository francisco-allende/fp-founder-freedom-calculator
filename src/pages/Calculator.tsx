import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { LiveTotal } from '../components/LiveTotal/LiveTotal';
import { ProgressBar } from '../components/ProgressBar/ProgressBar';
import { BRAND, WIZARD } from '../data/copy';
import { computeResults } from '../engine/math';
import { activeTasks, useWizard, type Step } from '../state/wizard';
import styles from './Calculator.module.css';
import { StepAbout } from './calculator/StepAbout';
import { StepCalendar } from './calculator/StepCalendar';
import { StepPreview } from './calculator/StepPreview';
import { StepTasks } from './calculator/StepTasks';
import type { StepProps } from './calculator/types';

export default function Calculator() {
  const [state, dispatch] = useWizard();
  const tasks = useMemo(() => activeTasks(state), [state]);
  const results = useMemo(() => computeResults(tasks, state.about.rate), [tasks, state.about.rate]);
  const navigated = useRef(false);

  const go = (step: Step) => {
    navigated.current = true;
    dispatch({ type: 'goTo', step });
    window.scrollTo({ top: 0 });
  };

  const props: StepProps = { state, dispatch, tasks, results, go, focusHeading: navigated.current };
  const withTotal = state.step === 2 || state.step === 3;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand}>
            {BRAND.title}
          </Link>
          <ProgressBar steps={WIZARD.steps} current={state.step} />
        </div>
      </header>
      <main className={`${styles.inner} ${styles.main} ${withTotal ? styles.withTotal : ''}`}>
        <div className={styles.content}>
          {state.step === 1 && <StepAbout {...props} />}
          {state.step === 2 && <StepTasks {...props} />}
          {state.step === 3 && <StepCalendar {...props} />}
          {state.step === 4 && <StepPreview {...props} />}
        </div>
        {withTotal && <LiveTotal results={results} />}
      </main>
      <Footer />
    </div>
  );
}
