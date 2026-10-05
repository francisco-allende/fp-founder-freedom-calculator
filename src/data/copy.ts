// Public copy. Rules (SPEC §6, §8): only official Pareto numbers, sentence case,
// no em dashes, buttons say what happens. A test enforces the em dash rule.

export const BRAND = {
  title: 'The Founder Freedom Calculator',
  subtitle:
    'Find the tasks eating 10+ hours of your week, and get a 90-day plan to hand them off. In 7 minutes.',
  footer: 'A Pareto Talent resource',
  paretoUrl: 'https://paretotalent.com',
} as const;

/** Official numbers (source: paretotalent.com, Day 1/10 decks). */
export const PROOF = {
  foundersServed: '100+ founders served',
  retention: '93% still together at 12 months',
  rating: '4.9 Google rating',
  selectivity: '1 in 1,000 applicants placed',
  speed: '3 hand-picked candidates in 24 hours',
  training: '40+ hours of training',
  network: '250+ Right Hands in the network',
  hoursSaved: 'Founders save 10–15 hrs/week in month 1',
} as const;

export const PRICING = {
  annualPlan: 'Annual plan $36,000/yr ($3,000/mo) + $3,000 placement',
  year1AllIn: 'Year 1 all-in: $39,000 annual · $43,000 quarterly · $46,200 monthly (each includes the $3,000 placement fee)',
} as const;

export const GUARANTEES = {
  matching: {
    name: 'Matching Guarantee',
    text: '3+ hand-picked candidates. If none feels right, you owe nothing. No contract until you find your person.',
  },
  freedom40: {
    name: 'Freedom 40 Guarantee',
    // Only ever shown together with its conditions.
    conditions:
      'Attend the Delegation Mastermind, follow the onboarding plan, and meet your Right Hand 10 minutes daily.',
    text: "If you don't get at least 40 hours back in your first 30 days, your next month is free.",
  },
  lifetimeReplacement: {
    name: 'Lifetime Replacement',
    text: 'If the match is ever not right, Pareto replaces your Right Hand at no cost.',
  },
} as const;

export const PAINS = [
  { pct: '80%', text: 'are drowning in admin' },
  { pct: '70%', text: 'have no time and no life outside work' },
  { pct: '60%+', text: 'have been burned by a VA before' },
  { pct: '50%', text: 'run the business from memory' },
  { pct: '40%', text: 'watch things fall through the cracks' },
  { pct: '30%', text: 'wear too many hats' },
] as const;

export const FOOTNOTE = 'Estimates based on your inputs and Pareto Talent client data.';

export const WIZARD = {
  steps: ['About you', 'Your tasks', 'Calendar X-ray', 'Your results'],
  about: {
    heading: 'First, a little about you',
    intro: 'This takes about a minute. Nothing is sent anywhere until you ask for your report.',
    firstName: 'First name',
    firstNameHint: 'We use it to personalize your report.',
    role: 'Your role',
    revenue: 'Annual revenue',
    timeline: 'When do you want help?',
    weeklyHours: 'Hours you work in a typical week',
    rate: 'Your effective hourly rate',
    rateHint: 'What an hour of your time is worth to the business. $200 is the default paretotalent.com uses.',
    rateHelperToggle: 'Not sure?',
    rateHelperTarget: 'Yearly income or profit target',
    rateHelperResult: (rate: string) => `That works out to about ${rate} an hour.`,
    rateHelperUse: 'Use this rate',
    required: 'Pick one to continue.',
  },
  tasks: {
    heading: 'Where do your hours go?',
    intro:
      'We picked the tasks most founders carry. Move the sliders to match your week, switch off what you never do, and add anything we missed.',
    hours: 'Hours per week',
    pct: 'A Right Hand could take',
    approval: 'needs your approval',
    include: (name: string) => `Include ${name}`,
    addHeading: 'Add a task',
    addName: 'Task name',
    addButton: 'Add this task',
    remove: (name: string) => `Remove ${name}`,
    estimate: 'Defaults are estimates. Change anything that doesn’t match your week.',
    noticeOver: 'Your tasks add up to more than the hours you work. Worth a second look.',
    noticeHigh: 'That leaves almost no time for the work only you can do.',
  },
  live: {
    label: 'You could hand off',
    perWeek: 'hours a week',
    range: (low: string, high: string) => `${low} to ${high} hours, realistically`,
    cost: (month: string) => `That time is worth ${month} a month.`,
  },
  calendar: {
    heading: 'Want a sharper result?',
    intro:
      'Add a calendar export and we will measure your meetings, focus time and fragmented hours from the last 4 weeks.',
    skip: 'Skip, I’m done',
    add: 'Add my calendar for a sharper result',
    privacy: 'Your calendar is read inside this browser tab. Nothing is uploaded or stored.',
    google: {
      title: 'Google Calendar',
      steps: [
        'Open Google Calendar on a computer and click the gear, then Settings.',
        'Choose Import & export, then Export. You get a .zip file.',
        'Drop that .zip here as it is. No need to unzip it.',
      ],
    },
    outlook: {
      title: 'Outlook',
      steps: [
        'In Outlook on the web, open Settings, then Calendar, then Shared calendars.',
        'Under Publish a calendar, pick your calendar and copy the ICS link.',
        'Open the link to download the .ics file, then drop it here.',
      ],
    },
    fileLabel: 'Calendar file (.ics or .zip)',
    processing: 'Reading your calendar…',
    error: 'We could not read that file. Try the .ics or .zip straight from your calendar export.',
    empty: 'We found no meetings in the last 4 complete weeks. Your result uses your task estimates instead.',
    stats: {
      meetings: 'hours of meetings a week',
      focus: 'focus blocks of 90+ minutes a week',
      fragmented: 'hours lost to gaps under 30 minutes',
    },
    suggestionsHeading: 'Suggested from your calendar',
    suggestionAccept: 'Use this',
    suggestionAccepted: 'Added to your tasks',
    heatmapCaption: 'Minutes booked per hour, average week',
    continue: 'See my results',
  },
  preview: {
    heading: (name: string) => (name ? `${name}, here is what your week is hiding` : 'Here is what your week is hiding'),
    hours: 'hours a week you could hand off',
    month: 'what that time costs you each month',
    year: 'what it costs you each year',
    gate: 'Your full report and 90-day plan are ready. Where should we send them?',
    blurredLabel: 'Preview of your 90-day plan and task map',
    formMissing: 'The form is not configured yet. Set VITE_GHL_FORM_ID to show it here.',
    continue: 'Continue to my report',
    sentHint: 'Sent it? Continue here if the page does not move on by itself.',
  },
  nav: {
    back: 'Back',
    next: 'Continue',
    toTasks: 'Pick my tasks',
    toCalendar: 'Continue',
  },
} as const;
