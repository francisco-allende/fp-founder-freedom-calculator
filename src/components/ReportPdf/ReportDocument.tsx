import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BRAND, FOOTNOTE } from '../../data/copy';
import { REPORT } from '../../data/pageCopy';
import { formatHours, formatMultiple } from '../../engine/format';
import type { RoadmapItem } from '../../engine/roadmap';
import { hoursRange, moneyRange } from '../../lib/display';
import { METHOD_ITEMS } from '../../report/method';
import type { ReportModel } from '../../report/model';
import { PdfAreaIcon } from './pdfIcons';

// Loaded only when someone clicks "Download PDF" (SPEC §10). Built-in Helvetica keeps text selectable.
// Same rounding as the site (design rule 7): whole-hour ranges, compact money; task rows keep one decimal.

// Never break words with hyphens (react-pdf hyphenates English by default: 'meet-ings').
Font.registerHyphenationCallback((word) => [word]);

const C = { forest: '#0E2A22', emerald: '#10B981', emeraldText: '#047857', amber: '#E39B2D', ink: '#14211C', slate: '#5B6B64', line: '#CFDCD5', mist: '#EEF4F1' };

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontFamily: 'Helvetica', fontSize: 10, color: C.ink, lineHeight: 1.45 },
  band: { backgroundColor: C.forest, color: '#FFFFFF', marginHorizontal: -40, marginTop: -40, padding: 40, paddingBottom: 24, marginBottom: 20 },
  brand: { fontSize: 9, color: '#BFD9CF', marginBottom: 6 },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold', lineHeight: 1.2 },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 8 },
  h3: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, borderTopWidth: 2, borderTopColor: C.emerald, paddingTop: 6 },
  statLead: { flex: 1.3, borderTopWidth: 2, borderTopColor: C.emerald, paddingTop: 6 },
  // Big figures need their own line height, or they overlap the label below.
  statValue: { fontSize: 15, fontFamily: 'Helvetica-Bold', lineHeight: 1.2, marginBottom: 2 },
  statValueLead: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.emeraldText, lineHeight: 1.2, marginBottom: 2 },
  statLabel: { fontSize: 8.5, color: C.slate },
  muted: { color: C.slate },
  small: { fontSize: 8.5, color: C.slate },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  barLabel: { width: 140, flexDirection: 'row', alignItems: 'center' },
  barLabelText: { fontSize: 9 },
  barTrack: { flex: 1, flexDirection: 'row', height: 9 },
  barValue: { width: 70, fontSize: 8.5, color: C.slate, textAlign: 'right' },
  col: { flex: 1 },
  mapItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  keepEmpty: { color: C.forest, fontSize: 9.5 },
  item: { marginBottom: 7 },
  // 3-stage plan
  stages: { flexDirection: 'row', gap: 14 },
  stage: { flex: 1 },
  track: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.forest, justifyContent: 'center', alignItems: 'center' },
  dotText: { color: C.emerald, fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  line: { flex: 1, height: 2, backgroundColor: C.emerald, marginLeft: 4, marginRight: -14 },
  task: { marginBottom: 8 },
  taskName: { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  pill: { alignSelf: 'flex-start', backgroundColor: C.mist, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2 },
  pillText: { fontSize: 8, color: C.forest, fontFamily: 'Helvetica-Bold' },
  ctaBox: { borderLeftWidth: 3, borderLeftColor: C.emerald, paddingLeft: 10, marginTop: 12 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: C.slate, flexDirection: 'row', justifyContent: 'space-between' },
});

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>{BRAND.footer} · paretotalent.com</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/** One stage of the plan: numbered dot on the connecting line, title, tasks with h/wk pills. */
function Stage({ n, title, items, last }: { n: number; title: string; items: RoadmapItem[]; last?: boolean }) {
  return (
    <View style={s.stage}>
      <View style={s.track}>
        <View style={s.dot}>
          <Text style={s.dotText}>{n}</Text>
        </View>
        {!last && <View style={s.line} />}
      </View>
      <Text style={s.h3}>{title}</Text>
      {items.length === 0 ? (
        <Text style={s.small}>{REPORT.roadmap.empty}</Text>
      ) : (
        items.map((i) => (
          <View key={i.taskId || i.name} style={s.task}>
            <Text style={i.kind === 'task' ? s.taskName : undefined}>{i.name}</Text>
            {i.kind === 'task' && (
              <View style={s.pill}>
                <Text style={s.pillText}>{REPORT.roadmap.hours(formatHours(i.hours))}</Text>
              </View>
            )}
            {i.kind === 'task' && <Text style={s.small}>{i.tip}</Text>}
          </View>
        ))
      )}
    </View>
  );
}

export function ReportDocument({ model }: { model: ReportModel }) {
  const { results, byArea, roadmap, map, calendar } = model;
  const maxTotal = Math.max(1, ...byArea.map((a) => a.total));
  const [p1, p2, p3] = REPORT.roadmap.phases;

  return (
    <Document title={REPORT.title(model.firstName)} author="Pareto Talent" subject={BRAND.title}>
      <Page size="LETTER" style={s.page}>
        <View style={s.band}>
          <Text style={s.brand}>{BRAND.title}</Text>
          <Text style={s.h1}>{REPORT.title(model.firstName)}</Text>
        </View>

        <View style={s.row}>
          <View style={s.statLead}>
            <Text style={s.statValueLead}>{hoursRange(results.hours.low, results.hours.realistic)}</Text>
            <Text style={s.statLabel}>{REPORT.summary.hours}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{moneyRange(results.monthly.low, results.monthly.realistic)}</Text>
            <Text style={s.statLabel}>{REPORT.summary.month}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{moneyRange(results.annual.low, results.annual.realistic)}</Text>
            <Text style={s.statLabel}>{REPORT.summary.year}</Text>
          </View>
        </View>
        <Text style={[s.small, { marginTop: 8 }]}>{FOOTNOTE}</Text>

        <Text style={s.h2}>{REPORT.weekChart.heading}</Text>
        {byArea.map((a) => (
          <View key={a.area} style={s.barRow}>
            <View style={s.barLabel}>
              <PdfAreaIcon area={a.area} />
              <Text style={s.barLabelText}>{a.area}</Text>
            </View>
            <View style={s.barTrack}>
              <View style={{ width: `${(a.delegable / maxTotal) * 100}%`, backgroundColor: C.emerald }} />
              <View style={{ width: `${(a.kept / maxTotal) * 100}%`, backgroundColor: C.amber, marginLeft: 1 }} />
            </View>
            <Text style={s.barValue}>
              {formatHours(a.delegable)} of {formatHours(a.total)} h
            </Text>
          </View>
        ))}
        <Text style={s.small}>
          Green: {REPORT.weekChart.handed.toLowerCase()}. Amber: {REPORT.weekChart.kept.toLowerCase()}.
        </Text>

        <Text style={s.h2}>{REPORT.map.heading}</Text>
        <View style={s.row}>
          {(
            [
              [REPORT.map.handOff, map.handOff, false],
              [REPORT.map.approval, map.handOffWithApproval, false],
              [REPORT.map.keep, map.keep, true],
            ] as const
          ).map(([title, list, isKeep]) => (
            <View key={title} style={s.col}>
              <Text style={s.h3}>{title}</Text>
              {list.length === 0 ? (
                <Text style={isKeep ? s.keepEmpty : s.muted}>{isKeep ? REPORT.map.keepEmpty : REPORT.map.empty}</Text>
              ) : (
                list.map((t) => (
                  <View key={t.id} style={s.mapItem}>
                    <PdfAreaIcon area={t.area} size={9} />
                    <Text>{t.name}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={[s.h2, { marginTop: 0 }]}>{REPORT.roadmap.heading}</Text>
        <View style={s.stages}>
          <Stage n={1} title={p1} items={roadmap.weeks1to2} />
          <Stage n={2} title={p2} items={roadmap.month1} />
          <Stage n={3} title={p3} items={roadmap.months2to3} last />
        </View>

        {calendar && (
          <View wrap={false}>
            <Text style={s.h2}>{REPORT.calendar.heading}</Text>
            <Text>
              {formatHours(calendar.meetingHoursPerWeek)} hours of meetings a week · {formatHours(calendar.focusBlocksPerWeek)} focus blocks of 90+
              minutes · {formatHours(calendar.fragmentedHoursPerWeek)} hours lost to gaps under 30 minutes
            </Text>
          </View>
        )}

        <Text style={s.h2}>{REPORT.method.heading}</Text>
        {METHOD_ITEMS.map((m) => (
          <View key={m.title} style={s.item} wrap={false}>
            <Text style={s.h3}>{m.title}</Text>
            <Text style={s.muted}>{m.text}</Text>
          </View>
        ))}

        <View style={s.ctaBox} wrap={false}>
          <Text style={s.h3}>{REPORT.cta.heading}</Text>
          <Text>
            Your hours are worth {formatMultiple(results.roiMultiple)} the $3,000/mo annual plan. {REPORT.cta.text}
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
