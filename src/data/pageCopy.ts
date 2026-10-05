// Copy for the landing, report, book, thanks and privacy pages.
// Same rules as copy.ts (SPEC §6, §8); covered by copy.test.ts.

export const NAV = {
  start: 'Start the calculator',
  privacy: 'Privacy',
  startOver: 'Start a new calculation',
} as const;

export const LANDING = {
  hero: {
    cta: 'Do the full calculation',
    slider: 'Hours on email per week',
    legend: 'Each square is 15 minutes of email.',
    onPlate: 'Still on your plate',
    handedOff: 'A Right Hand could take',
    result: (hours: string, money: string) => `A Right Hand could take about ${hours} of it, worth ${money} a month.`,
    assumption: 'Assumes 70% of email is delegable and $200 an hour, the paretotalent.com default. Change both in the full calculation.',
  },
  problem: {
    heading: 'Where founders get stuck',
    close: "Recognize three or more? It's not a productivity problem. It's a structural one.",
    // Official Pareto Talent data (design rule 1). Never a placeholder.
    source: 'Source: Pareto Talent, from 1,500+ founder calls.',
  },
  inside: {
    heading: "What's inside your report",
    previewLabel: 'A sample report, rendered by the same code that builds yours.',
    previewBadge: 'Sample report',
    items: [
      { title: 'Hours you can hand off', text: 'A realistic range, task by task, not one big guess.' },
      { title: 'What they cost you', text: 'Your hours times your rate, per month and per year, with the math shown.' },
      { title: 'Your task map', text: 'What to keep, what to hand off, and what to hand off with your approval.' },
      { title: 'Your 90-day handoff plan', text: 'Quick wins for weeks 1 and 2, then month 1, then months 2 and 3.' },
      { title: 'Optional calendar X-ray', text: 'Meeting load, focus time and fragmented hours from your last 4 weeks.' },
      { title: 'A PDF to keep', text: 'Download it, share it, or bring it to your next planning session.' },
    ],
  },
  who: {
    heading: 'Who it is for',
    intro: 'Founders and owners doing $500K+ a year who have become the bottleneck in their own business.',
    // Real client wording (Second Brain): a short quote + one plain line on who that founder is.
    personas: [
      {
        title: 'The bottleneck',
        quote: "I'm the bottleneck in my own company.",
        text: 'The founder every decision, approval and email still has to go through.',
      },
      {
        title: 'Burned before',
        quote: "I've had three different executive assistants before, and I thought it was me.",
        text: 'The founder who tried delegating, watched it fail, and took the work back.',
      },
      {
        title: 'No time to train',
        quote: "I don't have time to train someone right now.",
        text: 'The founder too busy to hand anything off, which is exactly why the week never gets lighter.',
      },
    ],
  },
  how: {
    heading: 'How it works',
    areasLabel: 'Seven areas, one task at a time',
    steps: [
      { title: 'Pick your tasks', text: 'Start from the tasks founders carry most and adjust the hours to your week.' },
      { title: 'Add your calendar (optional)', text: 'Drop in a calendar export for a sharper result. It never leaves your browser.' },
      { title: 'Get your report', text: 'Your hours, their cost and a 90-day plan, ready to act on.' },
    ],
  },
  proof: { heading: 'Founders who handed it off' },
  trust: {
    heading: 'Why trust the math',
    // The count comes from the test run that gates every build (see vite.config.ts).
    badge: (tests: number | null) =>
      tests ? `Every formula is tested · ${tests} automated tests` : 'Every formula is tested',
    text: 'Most ROI calculators multiply two guesses. This one works task by task, can read your real calendar, and shows its math.',
    link: 'See the method',
  },
  faq: {
    heading: 'Questions founders ask',
    items: [
      {
        q: 'Is my calendar uploaded?',
        a: 'No. Your calendar file is read inside your browser tab. Nothing is uploaded or stored, and you can skip that step entirely.',
      },
      { q: 'How long does it take?', a: 'About 7 minutes, or less if you skip the calendar step.' },
      {
        q: 'Is this a sales trick?',
        a: 'The report is yours either way. If a Right Hand fits where you are, we will offer a call. If not, you keep the report and the plan.',
      },
      {
        q: "What's a Right Hand?",
        // Pareto's own framing (provided by Francisco, 2026-10-04).
        a: 'A full-time, dedicated remote operator who owns outcomes, not just tasks. Pareto Right Hands are the top 1% of 1,000+ applicants, trained 40+ hours on AI tools, based in Latin America, fluent in English, and work your hours, exclusively for you.',
      },
    ],
  },
  final: {
    heading: 'Find your 10 hours',
    text: 'Seven minutes now, a lighter week for the next 90 days.',
  },
} as const;

export const REPORT = {
  title: (name: string) => (name ? `${name}'s Founder Freedom report` : 'Your Founder Freedom report'),
  missing: {
    heading: 'We could not open this report',
    text: 'The link may be incomplete. Run the calculator again to rebuild it. It takes about 7 minutes.',
  },
  summary: {
    hours: 'hours a week you could hand off',
    month: 'what that time costs you each month',
    year: 'what it costs you each year',
    yearHours: 'hours a year back in your calendar',
  },
  weekChart: {
    heading: 'Your week today vs with a Right Hand',
    kept: 'Stays with you',
    handed: 'Handed off',
    caption: 'Hours per week by area. The full bar is your week today; the amber part is what stays with you.',
  },
  yearChart: {
    heading: 'What 12 months of handoff adds up to',
    realistic: 'Realistic',
    low: 'Conservative',
    caption: 'Cumulative hours won back. Hover or tap a month for the dollar value.',
    end: (hours: string, money: string) => `${hours} hours, worth ${money}, by month 12`,
  },
  tableToggle: 'See the numbers',
  map: {
    heading: 'Your task map',
    keep: 'Keep',
    handOff: 'Hand off',
    approval: 'Hand off with approval',
    empty: 'Nothing here.',
  },
  roadmap: {
    heading: 'Your 90-day handoff plan',
    phases: ['Weeks 1–2: quick wins', 'Month 1', 'Months 2–3'],
    hours: (h: string) => `${h} h/week`,
    empty: 'Nothing left for this phase.',
  },
  calendar: { heading: 'Your calendar X-ray' },
  method: {
    heading: 'The method',
    toggle: 'Show the formulas and assumptions',
  },
  cta: {
    heading: 'Ready to hand these hours off?',
    text: 'On a matching call we go through this plan and introduce you to hand-picked Right Hand candidates.',
    button: 'Book my matching call',
  },
  pdf: {
    button: 'Download PDF',
    working: 'Preparing your PDF…',
    error: 'The PDF could not be created. Please try again.',
  },
} as const;

export const BOOK = {
  heading: "Your report is on its way. Let's match you with a Right Hand who can take these hours.",
  topTasks: 'The first hours to hand off',
  calendarHeading: 'Pick a time for your matching call',
  calendarMissing: 'The booking calendar is coming soon. Your report is already on its way to your inbox.',
  callHeading: 'What happens on the call',
  callSteps: [
    'We walk through your report and confirm which hours to hand off first.',
    'We define the Right Hand profile that fits how you work.',
    'You get 3 hand-picked candidates in 24 hours.',
  ],
  viewReport: 'View my report now',
} as const;

export const THANKS = {
  heading: 'Your report is in your inbox in about 2 minutes',
  nextHeading: 'What to do next',
  openReport: 'Open your report and check the numbers against your real week.',
  quickWinsIntro: 'Try your first 2 quick wins this week:',
  quickWinsFallback: 'Your first 2 quick wins are at the top of your 90-day plan.',
  supportHeading: 'Questions?',
  support: 'Reply to the email with your report. A real person reads every reply.',
  objectionHeading: 'When does a Right Hand make sense?',
  objection:
    'When 10 or more hours of your week are tasks someone else could do, and you would rather spend those hours growing the business. If that is not you yet, the plan still works with the tools and people you already have.',
  objectionLink: 'Learn how Pareto Talent works',
  viewReport: 'View my report',
} as const;

export const PRIVACY_CONTACT_EMAIL = 'franallende2000@gmail.com';

export const PRIVACY = {
  heading: 'Privacy',
  updated: 'Last updated: October 2026',
  sections: [
    {
      heading: 'Your calendar',
      text: 'If you add a calendar file, it is read inside your browser tab. It is never uploaded, sent or stored. Closing the tab clears it.',
    },
    {
      heading: 'Your answers',
      text: 'Your task estimates are kept in this browser tab while you use the calculator, so a refresh does not lose your work. Your report link carries your first name, hourly rate and task estimates, never your email, revenue or calendar events.',
    },
    {
      heading: 'The form',
      text: 'When you ask for your report, the details you enter in the form (name, email, phone if given, role, revenue range, timeline) and a summary of your results go to Pareto Talent’s CRM, so we can send your report and follow up.',
    },
    {
      heading: 'Unsubscribing',
      text: 'Every email has an unsubscribe link. You can also reply to any email and ask us to stop, or ask us to delete your details.',
    },
  ],
  contactLead: 'Questions about your data? Write to',
} as const;
