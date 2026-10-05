// "The method" section (SPEC §10), shared by the report page and the PDF.
// Official numbers are cited; our own assumptions are labeled as estimates.

export const METHOD_ITEMS = [
  {
    title: 'Hours you could hand off',
    text: 'For every task: hours per week × the share a Right Hand could take. Every task counts, in every area; nothing is left out of the total.',
  },
  {
    title: 'The range',
    text: 'The conservative end is 70% of the realistic number. That 70% is our estimate, not Pareto data, so you see a range instead of one optimistic figure.',
  },
  {
    title: 'What it costs you',
    text: 'Monthly cost = hours × your hourly rate × 4.3 weeks, the same formula paretotalent.com uses ($200 × 12.5 hours × 4.3 = $10,750). Yearly cost = monthly × 12.',
  },
  {
    title: 'Hours a year',
    text: 'Hours per week × 4.3 weeks × 12 months.',
  },
  {
    title: 'Your 90-day plan',
    text: 'Priority = hours × share × ease of handoff. Weeks 1–2 take the easiest tasks until 40% of your hours are covered; anything that touches money or cannot be undone waits until you grant it explicitly. Month 1 takes you to 75%. Months 2–3 cover the rest.',
  },
  {
    title: 'Defaults and your calendar',
    text: 'Default hours and shares are estimates you can change. If you added a calendar, it was read in your browser only: meetings in the last 4 complete weeks, without all-day, declined, free or personal events.',
  },
] as const;
