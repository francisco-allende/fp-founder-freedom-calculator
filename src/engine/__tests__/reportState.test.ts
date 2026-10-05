import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { customTask, TASKS, taskFromDef } from '../../data/tasks';
import { MAX_REPORT_URL_LENGTH } from '../constants';
import { analyzeCalendar } from '../calendar';
import { buildReportUrl, decodeReport, encodeReport, toReportCalendar } from '../reportState';
import { sanitizeName } from '../sanitize';
import type { ReportCalendar, ReportState } from '../types';

const ORIGIN = 'https://fp-founder-freedom-calculator.vercel.app';

/** Undo the URL-safe swap and decompress, to inspect the raw wire JSON. */
const wireJson = (d: string) => LZString.decompressFromEncodedURIComponent(d.replace(/_/g, '+').replace(/\./g, '$'));

/** 23 library tasks + 2 custom tasks with 40-char names = 25 tasks. */
function twentyFiveTasks() {
  return [
    ...TASKS.map((t, i) => taskFromDef(t, (i % 10) + 0.25, ((i * 7) % 100) / 100)),
    customTask('custom-23', 'Reviewing the weekly KPI dashboard deck', 2.5, 0.65),
    customTask('custom-24', 'Coordinating the quarterly board meeting', 1.75, 0.8),
  ];
}

/** A realistic heatmap: busy weekday mornings, light afternoons, empty weekends. */
function realisticHeatmap(): number[][] {
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 17 }, (_, s) => (d >= 5 ? 0 : s >= 3 && s <= 6 ? 30 + ((d * 7 + s) % 4) * 5 : s >= 8 && s <= 11 ? 15 : 0)),
  );
}

/** A worst case for compression: every cell different. */
function noisyHeatmap(): number[][] {
  let x = 7;
  return Array.from({ length: 7 }, () => Array.from({ length: 17 }, () => (x = (x * 31 + 17) % 61)));
}

const calendar = (heatmap: number[][] | null): ReportCalendar => ({
  meetingHoursPerWeek: 14.25,
  meetingsPerWeek: 21.5,
  focusBlocksPerWeek: 3.75,
  fragmentedHoursPerWeek: 1.5,
  heatmap,
});

const state = (cal: ReportCalendar | null, firstName = 'Francisco'): ReportState => ({
  firstName,
  rate: 200,
  tasks: twentyFiveTasks(),
  calendar: cal,
});

describe('test 6: report URL', () => {
  it('round-trips: decode(encode(x)) equals x', () => {
    for (const s of [state(null), state(calendar(realisticHeatmap())), state(calendar(noisyHeatmap()))]) {
      expect(decodeReport(encodeReport(s))).toEqual(s);
    }
  });

  it('25 tasks with a realistic heatmap stays under 2,000 chars with the heatmap kept', () => {
    const { url, heatmapDropped } = buildReportUrl(ORIGIN, state(calendar(realisticHeatmap())));
    expect(heatmapDropped).toBe(false);
    expect(url.length).toBeLessThan(MAX_REPORT_URL_LENGTH);
    expect(decodeReport(new URL(url).searchParams.get('d'))!.calendar!.heatmap).toEqual(realisticHeatmap());
  });

  it('25 tasks without a calendar stays under 2,000 chars', () => {
    const { url } = buildReportUrl(ORIGIN, state(null));
    expect(url.length).toBeLessThan(MAX_REPORT_URL_LENGTH);
  });

  it('a worst-case (noisy) heatmap with 25 tasks still fits without dropping anything', () => {
    const { url, heatmapDropped } = buildReportUrl(ORIGIN, state(calendar(noisyHeatmap())));
    expect(heatmapDropped).toBe(false);
    expect(url.length).toBeLessThan(MAX_REPORT_URL_LENGTH);
  });

  it('drops the heatmap but keeps the 4 summary stats when the full URL is too long', () => {
    // 25 tasks never get there, so grow the state with distinct custom tasks until the
    // full URL crosses 2,000 chars while the heatmap-less one still fits.
    const s = state(calendar(noisyHeatmap()));
    const fullLength = () => `${ORIGIN}/report?d=${encodeReport(s)}`.length;
    let seed = 1;
    while (fullLength() < MAX_REPORT_URL_LENGTH) {
      const name = Array.from({ length: 40 }, () => String.fromCharCode(97 + ((seed = (seed * 48_271) % 2_147_483_647) % 26))).join('');
      s.tasks.push(customTask(`custom-${s.tasks.length}`, name, 1, 0.5));
    }
    expect(fullLength()).toBeGreaterThanOrEqual(MAX_REPORT_URL_LENGTH); // precondition: this path is really exercised

    const { url, heatmapDropped } = buildReportUrl(ORIGIN, s);
    expect(heatmapDropped).toBe(true);
    expect(url.length).toBeLessThan(MAX_REPORT_URL_LENGTH);
    expect(decodeReport(new URL(url).searchParams.get('d'))!.calendar).toEqual(calendar(null));
  });

  it('never carries email, revenue or raw events', () => {
    const json = wireJson(encodeReport(state(calendar(realisticHeatmap()))))!;
    expect(Object.keys(JSON.parse(json)).sort()).toEqual(['c', 'n', 'r', 't', 'v']);
    expect(json).not.toMatch(/@|revenue|email/i);
  });

  it('sanitizes custom task names and first name on encode', () => {
    const dirty: ReportState = {
      firstName: '<b>Fran</b>\u0000',
      rate: 200,
      tasks: [customTask('custom-0', '<img src=x onerror=alert(1)>Invoices\u202E\tfor   clients and a very long tail that goes on', 1, 0.5)],
      calendar: null,
    };
    const json = JSON.parse(wireJson(encodeReport(dirty))!);
    expect(json.n).toBe('Fran');
    expect(json.t[0][0]).toBe('Invoices for clients and a very long tai'); // cut at exactly 40
    expect(json.t[0][0]).toHaveLength(40);
  });

  it('sanitizes again on decode (hand-crafted malicious URL)', () => {
    const crafted = LZString.compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        n: '<script>alert(1)</script>Eve',
        r: 1e12,
        t: [
          ['<svg onload=alert(1)>Evil task\u0007', 99, 400, 'c'],
          ['inbox', -5, 'x'],
          ['not-a-real-task', 3, 50],
          'garbage',
          ['inbox', 4, 50],
        ],
        c: { mh: 'NaN', mc: -1, fb: 2, fh: null, h: [1, 2, 3] },
      }),
    );
    const s = decodeReport(crafted)!;
    expect(s.firstName).toBe('alert(1)Eve');
    expect(s.rate).toBe(100_000);
    expect(s.tasks.map((t) => [t.name, t.hoursPerWeek, t.delegablePct])).toEqual([
      ['Evil task', 10, 1],
      ['Sorting and answering email', 0, 0], // first occurrence of inbox wins; later duplicate ignored
    ]);
    expect(s.calendar).toEqual({
      meetingHoursPerWeek: 0,
      meetingsPerWeek: 0,
      focusBlocksPerWeek: 2,
      fragmentedHoursPerWeek: 0,
      heatmap: null,
    });
  });

  it('drops custom tasks whose name is empty after sanitizing', () => {
    const crafted = LZString.compressToEncodedURIComponent(
      JSON.stringify({ v: 1, n: 'A', r: 200, t: [['<b></b>', 2, 50, 'c'], ['crm', 1, 90]], c: null }),
    );
    expect(decodeReport(crafted)!.tasks.map((t) => t.id)).toEqual(['crm']);
  });

  it('toReportCalendar keeps only what the URL needs', () => {
    const summary = analyzeCalendar('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', new Date(2026, 6, 15));
    expect(Object.keys(toReportCalendar(summary)).sort()).toEqual([
      'focusBlocksPerWeek',
      'fragmentedHoursPerWeek',
      'heatmap',
      'meetingHoursPerWeek',
      'meetingsPerWeek',
    ]);
  });

  it('returns null for missing, corrupt or unknown-version data', () => {
    expect(decodeReport(null)).toBeNull();
    expect(decodeReport('')).toBeNull();
    expect(decodeReport('not-lz-data!!')).toBeNull();
    expect(decodeReport(LZString.compressToEncodedURIComponent('{not json'))).toBeNull();
    expect(decodeReport(LZString.compressToEncodedURIComponent('{"v":2}'))).toBeNull();
    expect(decodeReport(LZString.compressToEncodedURIComponent('[1,2]'))).toBeNull();
  });
});

describe('report links survive real URLs and email clients', () => {
  /** What the /report page does: parse the link and read ?d= with URLSearchParams. */
  const dFrom = (link: string) => new URL(link).searchParams.get('d');

  // Many shapes, so the compressed data is sure to hit every lz-string symbol.
  const states = [
    state(null),
    state(calendar(realisticHeatmap())),
    state(calendar(noisyHeatmap())),
    state(null, 'José'),
    // Custom task ids come from their position in the link, so renumber after reordering.
    { ...state(null), tasks: twentyFiveTasks().reverse().map((t, i) => (t.custom ? { ...t, id: `custom-${i}` } : t)) },
  ];

  it('the encoded data never contains "+", "$" or anything URLSearchParams would rewrite', () => {
    for (const s of states) {
      const d = encodeReport(s);
      expect(d).toMatch(/^[A-Za-z0-9_.-]+$/);
      expect(new URLSearchParams(`d=${d}`).get('d')).toBe(d);
    }
  });

  it('round-trips through a real URL: build link → new URL(...).searchParams.get("d") → decode', () => {
    for (const s of states) {
      const { url } = buildReportUrl(ORIGIN, s);
      expect(url).toMatch(/&end=1$/);
      expect(decodeReport(dFrom(url))).toEqual(s);
    }
  });

  it('old links with "+" that arrived as spaces still decode', () => {
    for (const s of states) {
      const legacy = LZString.compressToEncodedURIComponent(wireJson(encodeReport(s))!);
      expect(decodeReport(dFrom(`${ORIGIN}/report?d=${legacy}`))).toEqual(s);
    }
  });

  it('a link pasted from an email client still decodes', () => {
    const s = state(calendar(realisticHeatmap()));
    const { url } = buildReportUrl(ORIGIN, s);
    const d = dFrom(url)!;
    const mid = Math.floor(d.length / 2);
    const mangled = [
      `${url}.`, // sentence punctuation glued to the link
      `${url})`, // link in parentheses
      ` ${url} `, // surrounding whitespace
      url.replace(d, `${d.slice(0, mid)}\r\n${d.slice(mid)}`), // hard line wrap (URL parser strips it)
      url.replace(d, `${d.slice(0, mid)}%20${d.slice(mid)}`), // wrap that became a space
      url.replace(d, encodeURIComponent(d)), // fully percent-encoded by the client
      url.replace(d, d.replace(/_/g, '%5F').replace(/\./g, '%2E')), // over-eager encoding
      url.replace('&end=1', ''), // tracking or copy that dropped the terminator
    ];
    for (const link of mangled) {
      expect(decodeReport(dFrom(link.trim())), link).toEqual(s);
    }
  });

  it('a link run through HighLevel (hidden field → email merge) decodes', () => {
    const s = state(calendar(realisticHeatmap()));
    const { url } = buildReportUrl(ORIGIN, s);
    // The app sends the URL as a query param; GHL stores the decoded value and prints it in the email.
    const stored = new URLSearchParams(new URLSearchParams({ fft_report_url: url }).toString()).get('fft_report_url')!;
    expect(stored).toBe(url);
    expect(decodeReport(dFrom(stored))).toEqual(s);
  });
});

describe('sanitizeName', () => {
  it('keeps normal names, accents and emoji intact', () => {
    expect(sanitizeName('José María')).toBe('José María');
    expect(sanitizeName('Ship it 🚀')).toBe('Ship it 🚀');
  });

  it('never splits an emoji at the 40-char limit', () => {
    const name = `${'a'.repeat(39)}🚀🚀`;
    expect(Array.from(sanitizeName(name))).toHaveLength(40);
  });

  it('non-strings become empty', () => {
    expect(sanitizeName(42)).toBe('');
    expect(sanitizeName(undefined)).toBe('');
  });
});
