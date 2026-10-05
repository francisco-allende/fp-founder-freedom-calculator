import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { isStoredQualification, readJSON, STORAGE_KEYS } from '../lib/storage';
import Calculator from './Calculator';
import { nextPath } from './Next';

function renderCalculator() {
  return render(
    <MemoryRouter>
      <Calculator />
    </MemoryRouter>,
  );
}

const choose = (group: string, option: string) =>
  fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name: option }));

function completeStep1(revenue = '$1M–$5M') {
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Fran' } });
  choose('Your role', 'Founder / Owner');
  choose('Annual revenue', revenue);
  choose('When do you want help?', 'Now');
  fireEvent.click(screen.getByRole('button', { name: 'Pick my tasks' }));
}

describe('calculator flow', () => {
  it('step 1 blocks until role, revenue and timeline are chosen', () => {
    renderCalculator();
    fireEvent.click(screen.getByRole('button', { name: 'Pick my tasks' }));
    expect(screen.getAllByText('Pick one to continue.')).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 1, name: 'First, a little about you' })).toBeInTheDocument();
    expect(document.activeElement).toBe(within(screen.getByRole('group', { name: 'Your role' })).getAllByRole('radio')[0]);
  });

  it('runs the whole flow and stores qualification before the form', async () => {
    renderCalculator();
    completeStep1();

    // Step 2: 14 preselected tasks → 16.05 h, shown as 16.1; heading takes focus.
    const heading = screen.getByRole('heading', { level: 1, name: 'Where do your hours go?' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText('11.2 to 16.1 hours, realistically')).toBeInTheDocument();
    expect(screen.getAllByText('needs your approval').length).toBeGreaterThan(0);

    // Switching off email (5h × 70% = 3.5h) updates the live total.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Sorting and answering email' }));
    expect(screen.getByText('8.8 to 12.6 hours, realistically')).toBeInTheDocument();

    // Add a custom task (defaults 1h × 50%).
    fireEvent.change(screen.getByLabelText('Task name'), { target: { value: 'Board updates' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add this task' }));
    expect(screen.getByRole('heading', { name: 'Your own tasks' })).toBeInTheDocument();
    expect(screen.getByText('9.1 to 13.1 hours, realistically')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 3: Skip has default focus.
    const skip = screen.getByRole('button', { name: 'Skip, I’m done' });
    expect(document.activeElement).toBe(skip);
    expect(screen.getByText('Your calendar is read inside this browser tab. Nothing is uploaded or stored.')).toBeInTheDocument();
    fireEvent.click(skip);

    // Step 4: headline numbers, footnote, gate.
    expect(screen.getByRole('heading', { level: 1, name: 'Fran, here is what your week is hiding' })).toBeInTheDocument();
    expect(screen.getByText('9.1–13.1')).toBeInTheDocument();
    expect(screen.getByText('Estimates based on your inputs and Pareto Talent client data.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your full report and 90-day plan are ready. Where should we send them?' })).toBeInTheDocument();

    // No VITE_GHL_FORM_ID in tests: the fallback Continue shows, and qualification is already stored.
    expect(await screen.findByRole('link', { name: 'Continue to my report' })).toHaveAttribute('href', '/next');
    const stored = readJSON(STORAGE_KEYS.qualification, isStoredQualification)!;
    expect(stored.qualified).toBe(true);
    expect(stored.tier).toBe('core');
    expect(stored.reportUrl).toMatch(/\/report\?d=/);
    expect(stored.topTasks).toEqual([
      'Scheduling and rescheduling meetings',
      'Follow-ups after calls',
      'Tracking projects and open loops',
    ]);
    expect(nextPath()).toBe('/book');
  });

  it('an unqualified founder is routed to /thanks', async () => {
    renderCalculator();
    completeStep1('$250K–$500K');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip, I’m done' }));
    await screen.findByRole('link', { name: 'Continue to my report' });
    expect(readJSON(STORAGE_KEYS.qualification, isStoredQualification)!.qualified).toBe(false);
    expect(nextPath()).toBe('/thanks');
  });

  it('a refresh keeps the work (sessionStorage)', () => {
    const first = renderCalculator();
    completeStep1();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Booking travel' }));
    first.unmount();

    renderCalculator();
    expect(screen.getByRole('heading', { level: 1, name: 'Where do your hours go?' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Include Booking travel' })).not.toBeChecked();
  });

  it('shows the soft notice when task hours pass 80% of the week', () => {
    renderCalculator();
    fireEvent.change(screen.getByLabelText('Hours you work in a typical week'), { target: { value: '30' } });
    completeStep1();
    // Defaults total 19.5h; push email to 10h → 24.5h > 80% of 30h.
    const inboxRow = screen.getByRole('checkbox', { name: 'Include Sorting and answering email' }).closest('li')!;
    act(() => {
      fireEvent.change(within(inboxRow).getByLabelText('Hours per week'), { target: { value: '10' } });
    });
    expect(screen.getByText('That leaves almost no time for the work only you can do.')).toBeInTheDocument();
  });

  it('with a form id: embeds the GHL form with exact prefill, and a GHL submit message reveals Continue', async () => {
    vi.stubEnv('VITE_GHL_FORM_ID', '7ub37F7yzxkw00xHGo8q');
    vi.stubEnv('VITE_SITE_URL', 'https://fp-founder-freedom-calculator.vercel.app');
    try {
      renderCalculator();
      completeStep1();
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      fireEvent.click(screen.getByRole('button', { name: 'Skip, I’m done' }));

      const frame = await screen.findByTitle('Where should we send your report?');
      const src = new URL(frame.getAttribute('src')!);
      expect(src.origin + src.pathname).toBe('https://api.leadconnectorhq.com/widget/form/7ub37F7yzxkw00xHGo8q');
      expect(src.searchParams.get('first_name')).toBe('Fran');
      expect(src.searchParams.get('fft_role')).toBe('Founder / Owner');
      expect(src.searchParams.get('fft_revenue')).toBe('$1M–$5M');
      expect(src.searchParams.get('fft_timeline')).toBe('Now');
      expect(src.searchParams.get('fft_qualified')).toBe('yes');
      expect(src.searchParams.get('fft_report_url')).toMatch(/^https:\/\/fp-founder-freedom-calculator\.vercel\.app\/report\?d=/);
      expect(document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]')).not.toBeNull();

      expect(screen.queryByRole('link', { name: 'Continue to my report' })).toBeNull();
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', data: 'form submitted' }));
      });
      expect(screen.queryByRole('link', { name: 'Continue to my report' })).toBeNull();
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://api.leadconnectorhq.com', data: { type: 'form-submitted' } }));
      });
      expect(screen.getByRole('link', { name: 'Continue to my report' })).toHaveAttribute('href', '/next');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('/next falls back to /thanks when storage is empty', () => {
    expect(nextPath()).toBe('/thanks');
  });
});
