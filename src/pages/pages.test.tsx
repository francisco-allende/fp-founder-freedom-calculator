import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { customTask, defaultTasks, TASKS_BY_ID, taskFromDef } from '../data/tasks';
import { encodeReport } from '../engine/reportState';
import type { ReportState } from '../engine/types';
import { STORAGE_KEYS, writeJSON, type StoredQualification } from '../lib/storage';
import { buildReportModel, pdfFileName, reportPath } from '../report/model';
import Book from './Book';
import Landing from './Landing';
import Privacy from './Privacy';
import Report from './Report';
import Thanks from './Thanks';

const state: ReportState = {
  firstName: 'Fran',
  rate: 200,
  tasks: defaultTasks(),
  calendar: {
    meetingHoursPerWeek: 14.5,
    meetingsPerWeek: 21,
    focusBlocksPerWeek: 3.5,
    fragmentedHoursPerWeek: 1.75,
    heatmap: Array.from({ length: 7 }, () => new Array(17).fill(15)),
  },
};
const d = encodeReport(state);
const reportUrl = `https://fp-founder-freedom-calculator.vercel.app/report?d=${d}`;

const at = (path: string, ui: React.ReactElement) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

function storeQualification(patch: Partial<StoredQualification> = {}) {
  writeJSON(STORAGE_KEYS.qualification, {
    qualified: true,
    tier: 'core',
    reportUrl,
    topTasks: ['Sorting and answering email', 'Scheduling and rescheduling meetings', 'Booking travel'],
    ...patch,
  });
}

describe('report model', () => {
  it('derives the same numbers the calculator showed', () => {
    const m = buildReportModel(state);
    expect(m.results.hours.realistic).toBeCloseTo(16.05, 10);
    expect(m.byArea.reduce((s, a) => s + a.delegable, 0)).toBeCloseTo(16.05, 10);
    expect(m.cumulative.realistic[11]!.dollars).toBeCloseTo(m.results.annual.realistic, 6);
    expect(m.cumulative.low[11]!.hours).toBeCloseTo(m.results.hoursPerYear.low, 6);
  });

  it('builds safe PDF file names', () => {
    expect(pdfFileName('Fran')).toBe('Founder-Freedom-Report-Fran.pdf');
    expect(pdfFileName('José María')).toBe('Founder-Freedom-Report-Jose-Maria.pdf');
    expect(pdfFileName('../../etc')).toBe('Founder-Freedom-Report-etc.pdf');
    expect(pdfFileName('')).toBe('Founder-Freedom-Report.pdf');
  });

  it('turns report URLs into in-app paths (works on preview deploys)', () => {
    expect(reportPath(reportUrl)).toBe(`/report?d=${d}`);
    expect(reportPath('https://evil.example/elsewhere?d=x')).toBeNull();
    expect(reportPath('not a url')).toBeNull();
  });
});

describe('/report', () => {
  it('rebuilds the report from ?d=', () => {
    at(`/report?d=${d}`, <Report />);
    expect(screen.getByRole('heading', { level: 1, name: "Fran's Founder Freedom report" })).toBeInTheDocument();
    expect(screen.getByText('11.2–16.1')).toBeInTheDocument();
    expect(screen.getByText('$9,662–$13,803')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your week today vs with a Right Hand' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your calendar X-ray' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book my matching call' })).toHaveAttribute('href', '/book');
    expect(screen.getByText('Estimates based on your inputs and Pareto Talent client data.')).toBeInTheDocument();
  });

  it('every chart has a table view with the numbers', () => {
    at(`/report?d=${d}`, <Report />);
    const tables = screen.getAllByRole('table', { hidden: true });
    expect(tables.length).toBeGreaterThanOrEqual(2);
    const week = tables.find((t) => within(t).queryByText('Inbox & calendar'))!;
    expect(within(week).getByText('Inbox & calendar')).toBeInTheDocument();
  });

  it('approval tasks are in their own task-map column and never in Weeks 1–2', () => {
    at(`/report?d=${d}`, <Report />);
    const approval = screen.getByRole('heading', { level: 3, name: 'Hand off with approval' }).parentElement!;
    expect(within(approval).getByText(TASKS_BY_ID.get('invoices')!.name)).toBeInTheDocument();
    const week1 = screen.getByRole('heading', { level: 3, name: /Weeks 1–2/ }).parentElement!;
    expect(within(week1).queryByText(TASKS_BY_ID.get('invoices')!.name)).toBeNull();
  });

  it('shows custom tasks by name', () => {
    const withCustom = encodeReport({ ...state, tasks: [taskFromDef(TASKS_BY_ID.get('crm')!), customTask('custom-1', 'Board updates', 3, 0.8)] });
    at(`/report?d=${withCustom}`, <Report />);
    expect(screen.getAllByText('Board updates').length).toBeGreaterThan(0);
  });

  it('a broken link explains itself and still shows the method', () => {
    at('/report?d=garbage', <Report />);
    expect(screen.getByRole('heading', { name: 'We could not open this report' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start the calculator' })).toHaveAttribute('href', '/calculator');
    expect(screen.getByRole('heading', { name: 'The method' })).toBeInTheDocument();
  });
});

describe('/book', () => {
  it('shows top tasks, the guarantee and an in-app report link', () => {
    storeQualification();
    at('/book', <Book />);
    expect(screen.getByRole('heading', { level: 1, name: /Let's match you with a Right Hand/ })).toBeInTheDocument();
    expect(screen.getByText('Booking travel')).toBeInTheDocument();
    expect(screen.getByText('You get 3 hand-picked candidates in 24 hours.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Matching Guarantee' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my report now' })).toHaveAttribute('href', `/report?d=${d}`);
  });

  it('with a calendar id: embeds the Matching Call booking widget, prefilled with the first name', () => {
    vi.stubEnv('VITE_GHL_CALENDAR_ID', 'WjMplcLNiuDvJMlWqQQb');
    try {
      storeQualification();
      at('/book', <Book />);
      const frame = screen.getByTitle('FP | Francisco Allende | Matching Call');
      expect(frame).toHaveAttribute('src', 'https://api.leadconnectorhq.com/widget/booking/WjMplcLNiuDvJMlWqQQb?first_name=Fran');
      expect(document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]')).not.toBeNull();
      expect(screen.queryByText(/booking calendar is coming soon/)).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('without a calendar id it says the calendar is coming', () => {
    at('/book', <Book />);
    expect(screen.getByText(/booking calendar is coming soon/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View my report now' })).toBeNull();
  });
});

describe('/thanks', () => {
  it('confirms, lists the first 2 quick wins and links the report', () => {
    storeQualification({ qualified: false, tier: null });
    at('/thanks', <Thanks />);
    expect(screen.getByRole('heading', { level: 1, name: 'Your report is in your inbox in about 2 minutes' })).toBeInTheDocument();
    expect(screen.getByText('Sorting and answering email')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my report' })).toHaveAttribute('href', `/report?d=${d}`);
    expect(screen.getByRole('link', { name: 'Learn how Pareto Talent works' })).toHaveAttribute('href', 'https://paretotalent.com');
  });

  it('falls back gracefully with empty storage', () => {
    at('/thanks', <Thanks />);
    expect(screen.getByText('Your first 2 quick wins are at the top of your 90-day plan.')).toBeInTheDocument();
  });
});

describe('/privacy and footer', () => {
  it('privacy says the calendar is never uploaded and where form data goes', () => {
    at('/privacy', <Privacy />);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByText(/never uploaded, sent or stored/)).toBeInTheDocument();
    expect(screen.getByText(/Pareto Talent’s CRM/)).toBeInTheDocument();
    expect(screen.getByText(/unsubscribe link/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'franallende2000@gmail.com' })).toHaveAttribute('href', 'mailto:franallende2000@gmail.com');
  });

  it('landing personas are client quotes, and the FAQ uses Pareto framing', () => {
    at('/', <Landing />);
    expect(screen.getByText(/I'm the bottleneck in my own company./)).toBeInTheDocument();
    expect(screen.getByText(/I don't have time to train someone right now/)).toBeInTheDocument();
    expect(screen.getByText(/owns outcomes, not just tasks/)).toBeInTheDocument();
  });

  it('the landing footer links to /privacy and paretotalent.com', () => {
    at('/', <Landing />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(within(footer).getByRole('link', { name: 'paretotalent.com' })).toHaveAttribute('href', 'https://paretotalent.com');
  });

  it('landing has the hero CTA, proof and the six pains with 60%+', () => {
    at('/', <Landing />);
    expect(screen.getByRole('heading', { level: 1, name: 'The Founder Freedom Calculator' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Start the calculator' })[0]).toHaveAttribute('href', '/calculator');
    expect(screen.getByText('60%+')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the method' })).toHaveAttribute('href', '/report#method');
  });
});
