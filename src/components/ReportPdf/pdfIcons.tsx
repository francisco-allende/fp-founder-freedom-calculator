import { Circle, Line, Path, Polyline, Rect, Svg, View } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { AREA_ICONS } from '../AreaIcon/AreaIcon';
import type { Area } from '../../engine/types';

type IconNode = [string, Record<string, string | number>][];

/**
 * Lucide's drawing data for an icon, read from the element the component renders.
 * lucide-react does not export it, so this leans on an internal prop; the version is pinned and
 * a test checks every area icon still resolves. Returns null if the shape ever changes.
 */
export function iconNode(area: Area): IconNode | null {
  try {
    const component = AREA_ICONS[area] as unknown as { render?: (props: object, ref: null) => ReactElement };
    const icon = (component.render?.({}, null)?.props as { icon?: unknown } | undefined)?.icon;
    // ESM build: { name, size, node: [...] }; CommonJS build: the node array itself.
    const node = Array.isArray(icon) ? icon : (icon as { node?: unknown } | undefined)?.node;
    return Array.isArray(node) && node.length > 0 && node.every((n) => Array.isArray(n) && typeof n[0] === 'string')
      ? (node as IconNode)
      : null;
  } catch {
    return null;
  }
}

const num = (v: string | number | undefined) => (v === undefined ? undefined : Number(v));

/** Area icon for the PDF (vector, stroke 1.5, forest). Falls back to an emerald dot. */
export function PdfAreaIcon({ area, size = 10, color = '#0E2A22' }: { area: Area; size?: number; color?: string }) {
  const node = iconNode(area);
  if (!node) {
    return <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size, backgroundColor: '#10B981', marginRight: 4 }} />;
  }
  const stroke = { stroke: color, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
      {node.map(([tag, a], i) => {
        switch (tag) {
          case 'path':
            return <Path key={i} d={String(a.d)} {...stroke} />;
          case 'polyline':
            return <Polyline key={i} points={String(a.points)} {...stroke} />;
          case 'circle':
            return <Circle key={i} cx={num(a.cx)!} cy={num(a.cy)!} r={num(a.r)!} {...stroke} />;
          case 'rect':
            return <Rect key={i} x={num(a.x)!} y={num(a.y)!} width={num(a.width)!} height={num(a.height)!} rx={num(a.rx)} {...stroke} />;
          case 'line':
            return <Line key={i} x1={num(a.x1)!} y1={num(a.y1)!} x2={num(a.x2)!} y2={num(a.y2)!} {...stroke} />;
          default:
            return null;
        }
      })}
    </Svg>
  );
}
