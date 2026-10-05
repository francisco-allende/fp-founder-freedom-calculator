import type { Dispatch } from 'react';
import type { Results } from '../../engine/math';
import type { TaskInput } from '../../engine/types';
import type { Step, WizardAction, WizardState } from '../../state/wizard';

export interface StepProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  tasks: TaskInput[];
  results: Results;
  go: (step: Step) => void;
  /** True after the user navigated between steps (not on first load). */
  focusHeading: boolean;
}
