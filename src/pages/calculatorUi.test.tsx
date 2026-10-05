import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { weekBlocks, workdaysBack } from '../components/LiveTotal/LiveTotal';
import { decodeReport } from '../engine/reportState';
import { STORAGE_KEYS } from '../lib/storage';
import Calculator from './Calculator';

// Design round 2: calculator interactivity.

const renderCalculator = () =>
  render(
    <MemoryRouter>
      <Calculator />
    </MemoryRouter>,
  );

const choose = (group: string, option: string) =>
  fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name: option }));

function toStep2() {
  choose('Your role', 'Founder / Owner');
  choose('Annual revenue', '$1M–$5M');
  choose('When do you want help?', 'Now');
  fireEvent.click(screen.getByRole('button', { name: 'Pick my tasks' }));
}

const toStep3 = () => {
  toStep2();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

const saved = () => JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.wizard)!);

describe('step 1', () => {
  it('selected pills show a check icon; the rate line updates as you type', () => {
    renderCalculator();
    choose('Your role', 'Founder / Owner');
    const pill = within(screen.getByRole('group', { name: 'Your role' })).getByRole('radio', { name: 'Founder / Owner' });
    expect(pill).toBeChecked();
    expect(pill.parentElement!.querySelector('svg')).not.toBeNull();
    const other = within(screen.getByRole('group', { name: 'Your role' })).getByRole('radio', { name: 'Executive' });
    expect(other.parentElement!.querySelector('svg')).toBeNull();

    expect(screen.getByText('1 hour of your time = $200')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Your effective hourly rate'), { target: { value: '1250' } });
    expect(screen.getByText('1 hour of your time = $1,250')).toBeInTheDocument();
  });
});

describe('step 2', () => {
  it('areas are collapsible cards: first open, the rest collapsed, with a live subtotal and count', () => {
    renderCalculator();
    toStep2();
    const inbox = screen.getByRole('button', { name: /^Inbox & calendar/ });
    const projects = screen.getByRole('button', { name: /^Projects & follow-through/ });
    expect(inbox).toHaveAttribute('aria-expanded', 'true');
    expect(projects).toHaveAttribute('aria-expanded', 'false');
    // 5×0.7 + 2×0.9 + 1×0.9 + 1.5×0.6 = 7.1 h
    expect(inbox).toHaveTextContent('7.1 h you could hand off · 4 of 4 tasks');
    expect(screen.queryByRole('checkbox', { name: 'Include Follow-ups after calls' })).toBeNull();

    fireEvent.click(projects);
    expect(projects).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'Include Follow-ups after calls' })).toBeInTheDocument();

    // The subtotal follows the sliders.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Booking travel' }));
    expect(inbox).toHaveTextContent('6.2 h you could hand off · 3 of 4 tasks');
  });

  it('an unchecked task keeps its controls in place, disabled and faded', () => {
    renderCalculator();
    toStep2();
    const row = screen.getByRole('checkbox', { name: 'Include Booking travel' }).closest('li')!;
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Booking travel' }));
    const sliders = within(row).getAllByRole('slider');
    expect(sliders).toHaveLength(2);
    for (const s of sliders) expect(s).toBeDisabled();
    expect(row.className).toMatch(/off/);
  });
});

describe('summary card', () => {
  it('shows "Your week" and the workdays line', () => {
    renderCalculator();
    toStep2();
    expect(screen.getByText('Your week')).toBeInTheDocument();
    // 16.05 h × 4.3 ÷ 8 = 8.6 → 9 workdays
    expect(screen.getByText('That’s about 9 workdays back every month')).toBeInTheDocument();
    expect(screen.getByText('Each block is 1 hour of your 55-hour week.')).toBeInTheDocument();
  });

  it('week blocks: handed off, then staying with you, then free; never more than the week', () => {
    expect(weekBlocks(55, 16.05, 19.5)).toEqual({ total: 55, handed: 16, kept: 4, free: 35 });
    expect(weekBlocks(30, 40, 60)).toEqual({ total: 30, handed: 30, kept: 0, free: 0 });
    expect(weekBlocks(40, 0, 0)).toEqual({ total: 40, handed: 0, kept: 0, free: 40 });
    expect(workdaysBack(0)).toBe(0);
    expect(workdaysBack(1)).toBe(1); // 4.3 / 8 = 0.54 → 1
    expect(workdaysBack(Number.NaN)).toBe(0);
  });
});

describe('progress bar', () => {
  it('completed steps show a check and take you back', () => {
    renderCalculator();
    toStep3();
    const nav = screen.getByRole('navigation', { name: 'Calculator progress' });
    const back = within(nav).getByRole('button', { name: /Your tasks/ });
    expect(back.querySelector('svg')).not.toBeNull();
    expect(within(nav).queryByRole('button', { name: /Calendar X-ray/ })).toBeNull(); // current step
    fireEvent.click(back);
    expect(screen.getByRole('heading', { level: 1, name: 'Where do your hours go?' })).toBeInTheDocument();
  });
});

describe('step 3: sample calendar', () => {
  it('"Add my calendar" is primary, "Skip" a secondary button with default focus, plus the sample option', () => {
    renderCalculator();
    toStep3();
    const add = screen.getByRole('button', { name: 'Add my calendar for a sharper result' });
    const skip = screen.getByRole('button', { name: 'Skip, I’m done' });
    expect(add.className).toMatch(/primary/);
    expect(skip.className).toMatch(/secondary/);
    expect(document.activeElement).toBe(skip);
    expect(screen.getByRole('button', { name: 'Try it with a sample calendar' })).toBeInTheDocument();
    expect(screen.getByText('What the X-ray shows')).toBeInTheDocument();
  });

  it('shows the full X-ray with a Sample data badge, without touching the user’s calendar or tasks', async () => {
    renderCalculator();
    toStep3();
    const tasksBefore = saved().tasks;
    fireEvent.click(screen.getByRole('button', { name: 'Try it with a sample calendar' }));

    expect(await screen.findByText('Sample data', {}, { timeout: 5000 })).toBeInTheDocument();
    const xray = screen.getByRole('region', { name: 'Sample calendar X-ray' });
    expect(within(xray).getByText('hours of meetings a week')).toBeInTheDocument();
    expect(within(xray).getByRole('table')).toBeInTheDocument(); // heatmap
    expect(within(xray).getAllByRole('button', { name: /^Use this/ })).toHaveLength(3);
    expect(within(xray).getByRole('heading', { name: 'Suggested from the sample calendar' })).toBeInTheDocument();

    // Nothing applied, nothing stored as the user's calendar.
    expect(saved().calendar).toBeNull();
    expect(saved().tasks).toEqual(tasksBefore);
  });

  it('a sample suggestion changes only its own task, and only when accepted', async () => {
    renderCalculator();
    toStep3();
    const before = saved();
    fireEvent.click(screen.getByRole('button', { name: 'Try it with a sample calendar' }));
    const accept = await screen.findByRole('button', { name: /^Use this: Scheduling and rescheduling meetings/ }, { timeout: 5000 });
    fireEvent.click(accept);

    const after = saved();
    expect(after.calendar).toBeNull();
    expect(after.tasks.sched.hours).not.toBe(before.tasks.sched.hours);
    for (const id of Object.keys(before.tasks)) {
      if (id !== 'sched') expect(after.tasks[id], id).toEqual(before.tasks[id]);
    }
    expect(screen.getByText('Added to your tasks')).toBeInTheDocument();

    // Closing the sample keeps what was explicitly accepted and nothing else.
    fireEvent.click(screen.getByRole('button', { name: 'Close the sample' }));
    expect(screen.queryByText('Sample data')).toBeNull();
    expect(saved().tasks.sched).toEqual(after.tasks.sched);
  });

  it('nothing from the sample reaches HighLevel', async () => {
    vi.stubEnv('VITE_GHL_FORM_ID', '7ub37F7yzxkw00xHGo8q');
    vi.stubEnv('VITE_SITE_URL', 'https://fp-founder-freedom-calculator.vercel.app');
    const formSrc = async () => new URL((await screen.findByTitle('Where should we send your report?')).getAttribute('src')!).searchParams;
    try {
      // Baseline: skip the calendar step.
      const first = renderCalculator();
      toStep3();
      fireEvent.click(screen.getByRole('button', { name: 'Skip, I’m done' }));
      const baseline = await formSrc();
      first.unmount();
      window.sessionStorage.clear();

      // Same answers, but open the sample and continue without accepting anything.
      renderCalculator();
      toStep3();
      fireEvent.click(screen.getByRole('button', { name: 'Try it with a sample calendar' }));
      await screen.findByText('Sample data', {}, { timeout: 5000 });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'See my results' }));
      });
      const withSample = await formSrc();

      expect(Object.fromEntries(withSample)).toEqual(Object.fromEntries(baseline));
      const report = decodeReport(new URL(withSample.get('fft_report_url')!).searchParams.get('d'));
      expect(report!.calendar).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
