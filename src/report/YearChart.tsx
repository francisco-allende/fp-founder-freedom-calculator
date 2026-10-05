import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { REPORT } from '../data/pageCopy';
import type { CumulativePoint } from '../engine/math';
import { CHART, ChartLegend, DataTable, TooltipBox } from './chartParts';
import { hoursWhole, moneyCompact } from '../lib/display';

const thousands = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Cumulative hours won back over 12 months. One axis (hours); dollars live in the tooltip, end label and table. */
export function YearChart({ realistic, low }: { realistic: CumulativePoint[]; low: CumulativePoint[] }) {
  const c = REPORT.yearChart;
  const rows = realistic.map((p, i) => ({
    month: p.month,
    hours: p.hours,
    dollars: p.dollars,
    lowHours: low[i]?.hours ?? 0,
    lowDollars: low[i]?.dollars ?? 0,
  }));
  const last = rows[rows.length - 1];

  return (
    <figure className="chart">
      <ChartLegend
        items={[
          { label: c.realistic, color: CHART.handed },
          { label: c.low, color: CHART.muted },
        ]}
      />
      {last && <p className="chart-end num">{c.end(hoursWhole(last.hours), moneyCompact(last.dollars))}</p>}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: CHART.grid }}
              tick={{ fill: CHART.muted, fontSize: 12 }}
              tickFormatter={(m: number) => `M${m}`}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART.muted, fontSize: 12 }}
              tickFormatter={(h: number) => thousands.format(h)}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: CHART.muted, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const r = active ? (payload?.[0]?.payload as (typeof rows)[number] | undefined) : undefined;
                return r ? (
                  <TooltipBox
                    title={`Month ${r.month}`}
                    rows={[
                      { label: c.realistic, value: `${hoursWhole(r.hours)} h · ${moneyCompact(r.dollars)}`, color: CHART.handed },
                      { label: c.low, value: `${hoursWhole(r.lowHours)} h · ${moneyCompact(r.lowDollars)}`, color: CHART.muted },
                    ]}
                  />
                ) : null;
              }}
            />
            <Area
              type="linear"
              dataKey="hours"
              stroke="none"
              fill={CHART.handed}
              fillOpacity={0.1}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              type="linear"
              dataKey="lowHours"
              stroke={CHART.muted}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2, fill: CHART.muted }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="hours"
              stroke={CHART.handed}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2, fill: CHART.handed }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-caption">{c.caption}</figcaption>
      <DataTable
        caption={c.heading}
        head={['Month', `${c.realistic} hours`, `${c.realistic} value`, `${c.low} hours`, `${c.low} value`]}
        rows={rows.map((r) => [
          String(r.month),
          hoursWhole(r.hours),
          moneyCompact(r.dollars),
          hoursWhole(r.lowHours),
          moneyCompact(r.lowDollars),
        ])}
      />
    </figure>
  );
}
