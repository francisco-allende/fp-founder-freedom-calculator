import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { defaultTasks } from '../data/tasks';
import { encodeReport } from '../engine/reportState';
import { STORAGE_KEYS, writeJSON } from '../lib/storage';
import Book from './Book';
import Calculator from './Calculator';
import Report from './Report';
import Thanks from './Thanks';

// Design round 3: results, report, book and thanks.

const d = encodeReport({ firstName: 'Fran', rate: 200, tasks: defaultTasks(), calendar: null });
const reportUrl = `https://fp-founder-freedom-calculator.vercel.app/report?d=${d}&end=1`;
const at = (path: string, ui: React.ReactElement) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
const storeRun = (qualified: boolean) =>
  writeJSON(STORAGE_KEYS.qualification, { qualified, tier: qualified ? 'core' : null, reportUrl, firstName: 'Fran' });

describe('step 4 results', () => {
  function toStep4() {
    at('/calculator', <Calculator />);
    const choose = (g: string, o: string) => fireEvent.click(within(screen.getByRole('group', { name: g })).getByRole('radio', { name: o }));
    choose('Your role', 'Founder / Owner');
    choose('Annual revenue', '$1M\u2013$5M');
    choose('When do you want help?', 'Now');
    fireEvent.click(screen.getByRole('button', { name: 'Pick my tasks' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip, I’m done' }));
  }

  it('weekly hours is the hero figure; month and year follow; screen readers get final values', async () => {
    toStep4();
    // Final values are always available to assistive tech, whatever stage the reveal is at.
    expect(screen.getByText('11–16')).toBeInTheDocument();
    expect(screen.getByText('$9.7K–$13.8K')).toBeInTheDocument();
    expect(screen.getByText('$116K–$166K')).toBeInTheDocument();
    const hero = screen.getByText('hours a week you could hand off').closest('div')!;
    expect(hero.className).toMatch(/lead/);
    // The staged reveal finishes with every card shown.
    await screen.findAllByText('$116K–$166K', {}, { timeout: 3000 });
  });

  it('the locked preview explains itself and takes the visitor to the form', () => {
    toStep4();
    const unlock = screen.getByRole('button', { name: /Your 90-day plan and task map unlock with your report/ });
    expect(unlock.querySelector('svg')).not.toBeNull(); // lock icon
    fireEvent.click(unlock);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: /Where should we send them/ }));
  });
});

describe('/report', () => {
  it('an empty Keep column says so as good news, with an icon', () => {
    at(`/report?d=${d}`, <Report />);
    const keep = screen.getByRole('heading', { level: 3, name: 'Keep' }).parentElement!;
    expect(within(keep).getByText('Everything you listed can be handed off. The strategic work is already yours.')).toBeInTheDocument();
    expect(keep.querySelector('svg')).not.toBeNull();
  });

  it('the plan is 3 connected stages with per-task hour pills ("h/wk")', () => {
    at(`/report?d=${d}`, <Report />);
    const plan = screen.getByRole('heading', { name: 'Your 90-day handoff plan' }).parentElement!;
    const stages = within(plan).getAllByRole('listitem').filter((li) => li.parentElement?.tagName === 'OL');
    expect(stages).toHaveLength(3);
    expect(within(plan).getByText('3.5 h/wk')).toBeInTheDocument(); // email: 5 h × 70%
  });
});

describe('/book and /thanks share one pattern', () => {
  it.each([
    ['/book', <Book key="b" />, true, /Let's match you/, 'Pick a time for your matching call'],
    ['/thanks', <Thanks key="t" />, false, /in your inbox/, 'View my report'],
  ] as const)('%s: animated check, title, primary button, Start a new calculation, content as cards', (path, page, qualified, title, primary) => {
    storeRun(qualified);
    at(path, page);
    const h1 = screen.getByRole('heading', { level: 1, name: title });
    const header = h1.parentElement!;
    expect(header.querySelector('svg')).not.toBeNull();
    const buttons = within(header).getAllByRole(primary === 'View my report' ? 'link' : 'button');
    expect(buttons[0]).toHaveTextContent(primary);
    expect(within(header).getByRole('button', { name: 'Start a new calculation' })).toBeInTheDocument();
  });

  it('/thanks shows the 2 quick wins as icon cards', () => {
    storeRun(false);
    at('/thanks', <Thanks />);
    const cards = screen.getByText('Try your first 2 quick wins this week:').nextElementSibling!;
    const items = within(cards as HTMLElement).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    for (const li of items) expect(li.querySelector('svg')).not.toBeNull();
    expect(within(items[0]!).getByText('Sorting and answering email')).toBeInTheDocument();
  });
});
