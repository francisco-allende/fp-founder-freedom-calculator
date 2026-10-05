import type { TaskDef, TaskInput } from '../engine/types';

// Defaults are ESTIMATES, editable by the founder (SPEC §7).
export const TASKS: readonly TaskDef[] = [
  { id: 'inbox', area: 'Inbox & calendar', name: 'Sorting and answering email', defaultHours: 5, defaultPct: 0.7, ease: 3, pre: true, appr: false,
    tip: 'Start with labels and a daily summary; let your Right Hand draft, you send.' },
  { id: 'sched', area: 'Inbox & calendar', name: 'Scheduling and rescheduling meetings', defaultHours: 2, defaultPct: 0.9, ease: 3, pre: true, appr: false,
    tip: 'Share your calendar rules once (focus blocks, buffers, no-meeting days) and cc them on every invite.' },
  { id: 'travel', area: 'Inbox & calendar', name: 'Booking travel', defaultHours: 1, defaultPct: 0.9, ease: 3, pre: true, appr: false,
    tip: 'Write down your seat, airline and hotel preferences once; approve the itinerary, not each booking.' },
  { id: 'brief', area: 'Inbox & calendar', name: 'Preparing for meetings', defaultHours: 1.5, defaultPct: 0.6, ease: 2, pre: true, appr: false,
    tip: 'Ask for a one-page brief the night before: who, why, last touchpoint, what you want out of it.' },
  { id: 'followup', area: 'Projects & follow-through', name: 'Follow-ups after calls', defaultHours: 1.5, defaultPct: 0.8, ease: 3, pre: true, appr: false,
    tip: 'Record or note the call; your Right Hand sends the recap and next steps within 24 hours.' },
  { id: 'tracker', area: 'Projects & follow-through', name: 'Tracking projects and open loops', defaultHours: 1.5, defaultPct: 0.8, ease: 2, pre: true, appr: false,
    tip: 'Keep one shared tracker; your Right Hand chases owners and gives you a Friday status.' },
  { id: 'vendors', area: 'Projects & follow-through', name: 'Managing vendors and contractors', defaultHours: 1, defaultPct: 0.7, ease: 2, pre: false, appr: false,
    tip: 'Hand over the contact list and the scope of each vendor; you step in only on renewals.' },
  { id: 'research', area: 'Projects & follow-through', name: 'Research and comparing options', defaultHours: 1.5, defaultPct: 0.8, ease: 2, pre: true, appr: false,
    tip: 'Ask for three options with a recommendation, not a list of links.' },
  { id: 'crm', area: 'Systems & automation', name: 'Updating the CRM', defaultHours: 1, defaultPct: 0.9, ease: 3, pre: true, appr: false,
    tip: 'Forward or bcc emails to your Right Hand; they log contacts, notes and next steps.' },
  { id: 'reports', area: 'Systems & automation', name: 'Rebuilding weekly reports', defaultHours: 1, defaultPct: 0.9, ease: 2, pre: true, appr: false,
    tip: 'Show them last week\'s report once; they rebuild it every Monday before you start.' },
  { id: 'sops', area: 'Systems & automation', name: 'Documenting processes (SOPs)', defaultHours: 1, defaultPct: 0.8, ease: 2, pre: false, appr: false,
    tip: 'Record a screen video while you work; your Right Hand turns it into a written SOP.' },
  { id: 'ai', area: 'Systems & automation', name: 'Setting up AI tools and automations', defaultHours: 1, defaultPct: 0.8, ease: 1, pre: false, appr: false,
    tip: 'Pick one repetitive workflow and let them pilot an automation for it before scaling.' },
  { id: 'content', area: 'Content & comms', name: 'Drafting posts and newsletters', defaultHours: 1.5, defaultPct: 0.6, ease: 2, pre: true, appr: false,
    tip: 'Talk for ten minutes into a voice memo; your Right Hand drafts, you edit the final line.' },
  { id: 'decks', area: 'Content & comms', name: 'Building decks and proposals', defaultHours: 1, defaultPct: 0.7, ease: 2, pre: false, appr: false,
    tip: 'Give them your best past deck as the template and a bullet outline for each new one.' },
  { id: 'social', area: 'Content & comms', name: 'Scheduling social media', defaultHours: 0.5, defaultPct: 0.9, ease: 3, pre: false, appr: false,
    tip: 'Approve a weekly batch of posts in one sitting; they schedule and reply to simple comments.' },
  { id: 'invoices', area: 'Money & admin', name: 'Sending invoices and chasing payments', defaultHours: 1, defaultPct: 0.8, ease: 2, pre: true, appr: true,
    tip: 'They prepare and send invoices from a template; you approve anything new or unusual.' },
  { id: 'expenses', area: 'Money & admin', name: 'Expense reports and receipts', defaultHours: 0.5, defaultPct: 0.9, ease: 3, pre: true, appr: false,
    tip: 'Snap receipts into one shared folder; your Right Hand files and reconciles them monthly.' },
  { id: 'subs', area: 'Money & admin', name: 'Managing subscriptions and renewals', defaultHours: 0.5, defaultPct: 0.9, ease: 3, pre: false, appr: true,
    tip: 'They keep a renewal calendar and flag each one two weeks ahead; you approve cancellations.' },
  { id: 'payroll', area: 'Money & admin', name: 'Payroll and payments', defaultHours: 0.5, defaultPct: 0.5, ease: 1, pre: false, appr: true,
    tip: 'They prepare the payroll run and checks; you release the money yourself.' },
  { id: 'hiring', area: 'Team & clients', name: 'Screening candidates', defaultHours: 1, defaultPct: 0.6, ease: 1, pre: false, appr: false,
    tip: 'Agree on three must-haves; they screen applications and book you only the finalists.' },
  { id: 'onboard', area: 'Team & clients', name: 'Onboarding new hires', defaultHours: 0.5, defaultPct: 0.6, ease: 1, pre: false, appr: false,
    tip: 'Build one onboarding checklist together; they run it for every new hire.' },
  { id: 'clientcomms', area: 'Team & clients', name: 'Routine client updates', defaultHours: 1, defaultPct: 0.5, ease: 2, pre: true, appr: false,
    tip: 'They draft the weekly client update from the tracker; you add one personal line.' },
  { id: 'personal', area: 'Personal', name: 'Personal appointments and gifts', defaultHours: 1, defaultPct: 0.9, ease: 3, pre: true, appr: false,
    tip: 'Share the family calendar and a gift list; they book, remind and order.' },
];

export const CUSTOM_TASK_TIP =
  'Record a five-minute walkthrough the next time you do it; your Right Hand takes the one after.';

export const TASKS_BY_ID: ReadonlyMap<string, TaskDef> = new Map(TASKS.map((t) => [t.id, t]));

export function taskFromDef(def: TaskDef, hoursPerWeek = def.defaultHours, delegablePct = def.defaultPct): TaskInput {
  return {
    id: def.id,
    name: def.name,
    area: def.area,
    hoursPerWeek,
    delegablePct,
    ease: def.ease,
    needsApproval: def.appr,
    tip: def.tip,
  };
}

export function customTask(id: string, name: string, hoursPerWeek: number, delegablePct: number): TaskInput {
  return {
    id,
    name,
    area: 'Your own tasks',
    hoursPerWeek,
    delegablePct,
    ease: 2,
    needsApproval: false,
    tip: CUSTOM_TASK_TIP,
    custom: true,
  };
}

/** The 14 preselected tasks with their default hours. */
export function defaultTasks(): TaskInput[] {
  return TASKS.filter((t) => t.pre).map((t) => taskFromDef(t));
}
