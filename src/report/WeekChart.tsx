import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { REPORT } from '../data/pageCopy';
import { formatHours } from '../engine/format';
import type { AreaHours } from '../engine/math';
import { useElementWidth } from '../hooks/useElementWidth';
import { CHART, ChartLegend, DataTable, TooltipBox } from './chartParts';

interface Row {
  area: string;
  handed: number;
  kept: number;
  total: number;
  label: string;
}

/** One stacked bar per area: emerald = handed off, amber = stays with you. Full bar = your week today. */
export function WeekChart({ byArea }: { byArea: AreaHours[] }) {
  const c = REPORT.weekChart;
  const rows: Row[] = byArea.map((a) => ({
    area: a.area,
    handed: a.delegable,
    kept: a.kept,
    total: a.total,
    label: `${formatHours(a.delegable)} of ${formatHours(a.total)} h`,
  }));
  const height = rows.length * 44 + 40;
  // Axis and label space scale with the chart's own width, so bars keep room at 375px.
  const [ref, width] = useElementWidth<HTMLElement>();
  const narrow = width < 520;
  const axisWidth = Math.round(Math.min(150, Math.max(84, width * 0.28)));
  const labelSpace = narrow ? 70 : 96;
  const tickSize = narrow ? 11 : 13;

  return (
    <figure className="chart" ref={ref}>
      <ChartLegend
        items={[
          { label: c.handed, color: CHART.handed },
          { label: c.kept, color: CHART.kept },
        ]}
      />
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: labelSpace, bottom: 4, left: 0 }} barSize={20}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} strokeWidth={1} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={{ stroke: CHART.grid }}
              tick={{ fill: CHART.muted, fontSize: 12 }}
              allowDecimals={false}
              unit=" h"
            />
            <YAxis
              type="category"
              dataKey="area"
              width={axisWidth}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART.ink, fontSize: tickSize }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(14, 42, 34, 0.04)' }}
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <TooltipBox
                    title={(payload[0].payload as Row).area}
                    rows={[
                      { label: c.handed, value: `${formatHours((payload[0].payload as Row).handed)} h`, color: CHART.handed },
                      { label: c.kept, value: `${formatHours((payload[0].payload as Row).kept)} h`, color: CHART.kept },
                    ]}
                  />
                ) : null
              }
            />
            {/* The surface-colored stroke is the 2px gap between segments. */}
            <Bar dataKey="handed" stackId="week" fill={CHART.handed} stroke={CHART.surface} strokeWidth={2} isAnimationActive={false} />
            <Bar
              dataKey="kept"
              stackId="week"
              fill={CHART.kept}
              stroke={CHART.surface}
              strokeWidth={2}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList dataKey="label" position="right" fill={CHART.muted} fontSize={narrow ? 11 : 12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-caption">{c.caption}</figcaption>
      <DataTable
        caption={c.heading}
        head={['Area', c.handed, c.kept, 'Today']}
        rows={rows.map((r) => [r.area, `${formatHours(r.handed)} h`, `${formatHours(r.kept)} h`, `${formatHours(r.total)} h`])}
      />
    </figure>
  );
}
