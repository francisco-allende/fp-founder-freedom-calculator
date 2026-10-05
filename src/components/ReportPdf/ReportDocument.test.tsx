// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { customTask, defaultTasks, TASKS_BY_ID, taskFromDef } from '../../data/tasks';
import { buildReportModel } from '../../report/model';
import { ReportDocument } from './ReportDocument';

const text = (pdf: Uint8Array) => new TextDecoder('latin1').decode(pdf);
const pageCount = (pdf: Uint8Array) => (text(pdf).match(/\/Type\s*\/Page[^s]/g) ?? []).length;

describe('ReportDocument (PDF)', () => {
  it('renders a 2-page PDF from a full report', async () => {
    const model = buildReportModel({
      firstName: 'Fran',
      rate: 200,
      tasks: [...defaultTasks(), customTask('custom-0', 'Board updates', 2, 0.6)],
      calendar: { meetingHoursPerWeek: 14.5, meetingsPerWeek: 21, focusBlocksPerWeek: 3.5, fragmentedHoursPerWeek: 1.75, heatmap: null },
    });
    const pdf = await renderToBuffer(<ReportDocument model={model} />);
    expect(text(pdf.subarray(0, 5))).toBe('%PDF-');
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(2);
    expect(pageCount(pdf)).toBeLessThanOrEqual(3);
    // Real text, not images: the standard Helvetica font is embedded as a text font.
    expect(text(pdf)).toMatch(/\/BaseFont\s*\/Helvetica/);
  }, 30_000);

  it('renders the edge cases: no tasks, only approval tasks, no name', async () => {
    for (const tasks of [[], [taskFromDef(TASKS_BY_ID.get('invoices')!)]]) {
      const pdf = await renderToBuffer(<ReportDocument model={buildReportModel({ firstName: '', rate: 0, tasks, calendar: null })} />);
      expect(text(pdf.subarray(0, 5))).toBe('%PDF-');
    }
  }, 30_000);
});

describe('PDF area icons', () => {
  it('every area resolves to lucide vector data (no silent fallback to dots)', async () => {
    const { iconNode } = await import('./pdfIcons');
    const { AREA_ICONS } = await import('../AreaIcon/AreaIcon');
    for (const area of Object.keys(AREA_ICONS) as (keyof typeof AREA_ICONS)[]) {
      const node = iconNode(area);
      expect(node, area).not.toBeNull();
      expect(node!.every(([tag]) => ['path', 'polyline', 'circle', 'rect', 'line'].includes(tag)), area).toBe(true);
    }
  });
});
