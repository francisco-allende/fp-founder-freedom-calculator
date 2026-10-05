import { CirclePlus, Heart, Inbox, ListChecks, PenLine, Receipt, Users, Workflow, type LucideIcon } from 'lucide-react';
import type { Area } from '../../engine/types';
import styles from './AreaIcon.module.css';

/** One icon per task area, shared by the calculator, the report and the landing page. */
export const AREA_ICONS: Record<Area, LucideIcon> = {
  'Inbox & calendar': Inbox,
  'Projects & follow-through': ListChecks,
  'Systems & automation': Workflow,
  'Content & comms': PenLine,
  'Money & admin': Receipt,
  'Team & clients': Users,
  Personal: Heart,
  'Your own tasks': CirclePlus,
};

/** Decorative: the area name is always written next to it. Emerald on dark, forest on light. */
export function AreaIcon({ area, tone = 'light', size = 20 }: { area: Area; tone?: 'light' | 'dark'; size?: number }) {
  const Icon = AREA_ICONS[area];
  return <Icon className={tone === 'dark' ? styles.dark : styles.light} size={size} strokeWidth={1.5} aria-hidden="true" focusable="false" />;
}
