import { REPORT } from '../data/pageCopy';

/**
 * Chart colors. Emerald/amber validated with the dataviz palette script (CVD ΔE 8.7, normal ΔE 21.3);
 * contrast vs the surface is below 3:1, so every chart carries a legend, a direct label and a table view.
 * Text never wears the series color.
 */
export const CHART = {
  handed: '#10B981',
  kept: '#E39B2D',
  muted: '#5B6B64',
  ink: '#14211C',
  grid: '#E3ECE7',
  surface: '#FFFFFF',
} as const;

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="chart-legend">
      {items.map((i) => (
        <li key={i.label}>
          <span className="chart-swatch" style={{ background: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color: string }[] }) {
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="num">
          <span className="chart-swatch" style={{ background: r.color }} aria-hidden="true" /> {r.label}: {r.value}
        </p>
      ))}
    </div>
  );
}

/** The table twin every chart carries, so no value depends on color or hover. */
export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <details className="chart-table">
      <summary>{REPORT.tableToggle}</summary>
      <table>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={i > 0 ? 'num' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="num">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
