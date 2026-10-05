import { describe, expect, it } from 'vitest';
import { analysisWindow, analyzeCalendar, categorize, isPersonal } from '../calendar';
// Fixture times are floating (no TZ), so they are read in the machine's local time
// and the expectations hold in any timezone.
import fixture from './fixtures/sample.ics?raw';
// Wednesday → window is Mon 2026-06-15 00:00 to Mon 2026-07-13 00:00.
const NOW = new Date(2026, 6, 15, 12, 0);

describe('analysisWindow', () => {
  it('is the last 4 complete Mon–Sun weeks before today', () => {
    const { start, end } = analysisWindow(NOW);
    expect(start).toEqual(new Date(2026, 5, 15));
    expect(end).toEqual(new Date(2026, 6, 13));
  });

  it('on a Monday, the current week is excluded', () => {
    expect(analysisWindow(new Date(2026, 6, 13, 9)).end).toEqual(new Date(2026, 6, 13));
  });
});

describe('test 7: calendar fixture', () => {
  const s = analyzeCalendar(fixture, NOW);

  // Counted work meetings: 4 weekly syncs (one moved by an exception), 1:1 with Ana, Client demo.
  // Dropped: declined call, all-day offsite, transparent hold, 10h conference, events outside the window.
  // Personal: Dentist.
  it('meeting totals', () => {
    expect(s.weeks).toBe(4);
    expect(s.meetingsPerWeek).toBe(1.5); // 6 / 4
    expect(s.meetingHoursPerWeek).toBe(1.25); // 5h / 4
  });

  it('dentist counts as personal time, not work', () => {
    expect(s.personalHoursPerWeek).toBe(0.25);
  });

  it('categories', () => {
    expect(s.categoryHoursPerWeek).toEqual({
      'Client & sales': 0.125,
      Internal: 1.125,
      Hiring: 0,
      Content: 0,
      'Other meetings': 0,
    });
  });

  it('focus blocks: free gaps ≥ 90 min inside 9:00–18:00 on weekdays', () => {
    // 20 weekdays with one long gap each, plus a second gap on Thu 06-18 (dentist) and Tue 06-23 (demo).
    expect(s.focusBlocksPerWeek).toBe(5.5);
  });

  it('fragmented time: the 15-min gap between the sync and the 1:1', () => {
    expect(s.fragmentedHoursPerWeek).toBeCloseTo(0.0625, 10);
  });

  it('heatmap: 7 × 17, averaged whole minutes, recurrence exception honored', () => {
    expect(s.heatmap).toHaveLength(7);
    for (const row of s.heatmap) expect(row).toHaveLength(17);

    const expected = Array.from({ length: 7 }, () => new Array(17).fill(0));
    expected[0]![4] = 45; // Mon 10:00: sync on 3 of 4 Mondays (one moved)
    expected[0]![5] = 8; // Mon 11:00: 1:1, 30 min / 4 = 7.5 → 8
    expected[0]![10] = 15; // Mon 16:00: the moved sync
    expected[1]![5] = 8; // Tue 11:00: client demo
    expect(s.heatmap).toEqual(expected);
  });

  it('suggested hours from meeting count (estimates)', () => {
    expect(s.suggestedHours.scheduling).toBeCloseTo(0.25, 10); // 1.5 × 10 min
    expect(s.suggestedHours.prepAndFollowUp).toBeCloseTo(0.375, 10); // 1.5 × 15 min
  });

  it('the same calendar exported twice is not double counted', () => {
    expect(analyzeCalendar([fixture, fixture], NOW)).toEqual(s);
  });
});

describe('declined detection without X-WR-CALNAME', () => {
  it('falls back to the most frequent ORGANIZER as owner', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      ...[1, 2].map((d) =>
        ['BEGIN:VEVENT', `UID:own-${d}`, 'SUMMARY:Team standup', `DTSTART:2026061${d + 5}T090000`, `DTEND:2026061${d + 5}T093000`, 'ORGANIZER:mailto:me@co.com', 'END:VEVENT'].join('\n'),
      ),
      'BEGIN:VEVENT',
      'UID:declined',
      'SUMMARY:Vendor pitch',
      'DTSTART:20260619T140000',
      'DTEND:20260619T150000',
      'ORGANIZER:mailto:vendor@x.com',
      'ATTENDEE;PARTSTAT=DECLINED:mailto:me@co.com',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    expect(analyzeCalendar(ics, NOW).meetingsPerWeek).toBe(0.5); // 2 standups, pitch dropped
  });
});

describe('events with DURATION instead of DTEND', () => {
  it('counts them inside the window and skips old ones', () => {
    const ev = (uid: string, start: string) =>
      ['BEGIN:VEVENT', `UID:${uid}`, 'SUMMARY:Podcast recording', `DTSTART:${start}`, 'DURATION:PT2H', 'END:VEVENT'].join('\n');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', ev('in', '20260701T100000'), ev('old', '20250101T100000'), 'END:VCALENDAR'].join('\n');
    const s = analyzeCalendar(ics, NOW);
    expect(s.meetingsPerWeek).toBe(0.25);
    expect(s.categoryHoursPerWeek.Content).toBe(0.5);
  });
});

describe('orphan recurrence exceptions', () => {
  it('an exception whose master is not in the file counts as a single event', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:master-lives-elsewhere',
      'RECURRENCE-ID:20260622T090000',
      'SUMMARY:Hiring debrief',
      'DTSTART:20260622T093000',
      'DTEND:20260622T103000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    expect(analyzeCalendar(ics, NOW).categoryHoursPerWeek.Hiring).toBe(0.25);
  });
});

describe('classifiers', () => {
  it('categories: first match wins, case-insensitive', () => {
    expect(categorize('Sales team sync')).toBe('Client & sales');
    expect(categorize('WEEKLY review')).toBe('Internal');
    expect(categorize('Candidate interview')).toBe('Hiring');
    expect(categorize('Podcast recording')).toBe('Content');
    expect(categorize('Coffee')).toBe('Other meetings');
  });

  it('personal filter', () => {
    for (const t of ['Gym', 'Kids pickup', 'Lunch with Mom', 'Flight to NYC', 'Family dinner']) expect(isPersonal(t), t).toBe(true);
    expect(isPersonal('Lunch & learn')).toBe(false);
  });
});

describe('performance', () => {
  it('a 3-year export analyzes in under 2 seconds', () => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:fran@example.com'];
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = new Date(2023, 6, 13); // 3 years ending at the window end (Mon 2026-07-13)
    let uid = 0;
    for (let day = 0; day < 3 * 365 + 1; day++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      for (const hour of [9, 10, 11, 13, 14, 15, 16]) {
        lines.push(
          'BEGIN:VEVENT',
          `UID:e${uid++}`,
          `SUMMARY:Client call ${uid}`,
          `DTSTART:${ymd}T${pad(hour)}0000`,
          `DTEND:${ymd}T${pad(hour)}4500`,
          'ATTENDEE;PARTSTAT=ACCEPTED:mailto:fran@example.com',
          'END:VEVENT',
        );
      }
    }
    // Long-running recurring events that started at the beginning of the export.
    for (const rule of ['FREQ=DAILY', 'FREQ=WEEKLY;BYDAY=MO,WE,FR', 'FREQ=WEEKLY;BYDAY=TU', 'FREQ=MONTHLY;BYMONTHDAY=1']) {
      lines.push('BEGIN:VEVENT', `UID:r${uid++}`, `SUMMARY:Standup (${rule})`, 'DTSTART:20230703T083000', 'DTEND:20230703T084500', `RRULE:${rule}`, 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    const ics = lines.join('\r\n');

    const t0 = performance.now();
    const s = analyzeCalendar(ics, NOW);
    const elapsed = performance.now() - t0;

    // Per week: 35 one-off calls + 7 daily + 3 MWF + 1 Tuesday; plus the monthly one on Wed Jul 1 (1/4).
    expect(s.meetingsPerWeek).toBe(46.25);
    expect(elapsed).toBeLessThan(2000);
  });
});
