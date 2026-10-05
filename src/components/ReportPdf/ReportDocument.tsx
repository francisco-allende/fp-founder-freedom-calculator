import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BRAND, FOOTNOTE } from '../../data/copy';
import { REPORT } from '../../data/pageCopy';
import { formatHours, formatMultiple } from '../../engine/format';
import type { RoadmapItem } from '../../engine/roadmap';
import type { ReportModel } from '../../report/model';
import { METHOD_ITEMS } from '../../report/method';
import { hoursRange, moneyRange } from '../../lib/display';

// Loaded only when someone clicks "Download PDF" (SPEC §10). Built-in Helvetica keeps text selectable.

const C = { forest: '#0E2A22', emerald: '#10B981', emeraldText: '#047857', amber: '#E39B2D', ink: '#14211C', slate: '#5B6B64', line: '#CFDCD5', mist: '#EEF4F1' };

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: C.ink, lineHeight: 1.45 },
  band: { backgroundColor: C.forest, color: '#FFFFFF', marginHorizontal: -40, marginTop: -40, padding: 40, paddingBottom: 24, marginBottom: 20 },
  brand: { fontSize: 9, color: '#BFD9CF', marginBottom: 6 },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 8 },
  h3: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, borderTopWidth: 2, borderTopColor: C.emerald, paddingTop: 6 },
  statValue: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 8.5, color: C.slate },
  muted: { color: C.slate },
  small: { fontSize: 8.5, color: C.slate },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  barLabel: { width: 130, fontSize: 9 },
  barTrack: { flex: 1, flexDirection: 'row', height: 9 },
  barValue: { width: 70, fontSize: 8.5, color: C.slate, textAlign: 'right' },
  col: { flex: 1 },
  item: { marginBottom: 7 },
  phase: { borderLeftWidth: 3, borderLeftColor: C.emerald, paddingLeft: 10, marginBottom: 12 },
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

function Phase({ title, items }: { title: string; items: RoadmapItem[] }) {
  return (
    <View style={s.phase} wrap={false}>
      <Text style={s.h3}>{title}</Text>
      {items.length === 0 ? (
        <Text style={s.muted}>{REPORT.roadmap.empty}</Text>
      ) : (
        items.map((i) => (
          <View key={i.taskId || i.name} style={s.item}>
            <Text>
              {i.kind === 'setup' ? i.name : `${i.name} · ${REPORT.roadmap.hours(formatHours(i.hours))}`}
            </Text>
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
          <View style={s.stat}>
            <Text style={s.statValue}>
              {hoursRange(results.hours.low, results.hours.realistic)}
            </Text>
            <Text style={s.statLabel}>{REPORT.summary.hours}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>
              {moneyRange(results.monthly.low, results.monthly.realistic)}
            </Text>
            <Text style={s.statLabel}>{REPORT.summary.month}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>
              {moneyRange(results.annual.low, results.annual.realistic)}
            </Text>
            <Text style={s.statLabel}>{REPORT.summary.year}</Text>
          </View>
        </View>
        <Text style={[s.small, { marginTop: 8 }]}>{FOOTNOTE}</Text>

        <Text style={s.h2}>{REPORT.weekChart.heading}</Text>
        {byArea.map((a) => (
          <View key={a.area} style={s.barRow}>
            <Text style={s.barLabel}>{a.area}</Text>
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
              [REPORT.map.handOff, map.handOff],
              [REPORT.map.approval, map.handOffWithApproval],
              [REPORT.map.keep, map.keep],
            ] as const
          ).map(([title, list]) => (
            <View key={title} style={s.col}>
              <Text style={s.h3}>{title}</Text>
              {list.length === 0 ? <Text style={s.muted}>{REPORT.map.empty}</Text> : list.map((t) => <Text key={t.id}>{t.name}</Text>)}
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={[s.h2, { marginTop: 0 }]}>{REPORT.roadmap.heading}</Text>
        <Phase title={`1. ${p1}`} items={roadmap.weeks1to2} />
        <Phase title={`2. ${p2}`} items={roadmap.month1} />
        <Phase title={`3. ${p3}`} items={roadmap.months2to3} />

        {calendar && (
          <View wrap={false}>
            <Text style={s.h2}>{REPORT.calendar.heading}</Text>
            <Text>
              {formatHours(calendar.meetingHoursPerWeek)} hours of meetings a week · {formatHours(calendar.focusBlocksPerWeek)} focus blocks of 90+ minutes · {formatHours(calendar.fragmentedHoursPerWeek)} hours lost to gaps under 30 minutes
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

        <View style={[s.phase, { marginTop: 12 }]} wrap={false}>
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
