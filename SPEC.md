# SPEC — The Founder Freedom Calculator

> Build spec for Claude Code. Put this file at the repo root and start with:
> "Read SPEC.md end to end. Then propose the file plan before writing code."

Project: Pareto Talent final project (lead magnet + funnel). Owner: Francisco Allende.
Naming inside tools: `FP | Francisco Allende | <Item>`. Repo name: `fp-founder-freedom-calculator`.

---

## 1. What we're building

A free web app for founders that answers one question in about 7 minutes:
**"Which tasks are eating 10+ hours of my week, what do they cost me, and how do I hand them off?"**

- **Title:** The Founder Freedom Calculator
- **Subtitle:** Find the tasks eating 10+ hours of your week, and get a 90-day plan to hand them off. In 7 minutes.
- **Business goal:** qualified founders book a Matching Call with Pareto Talent about the Right Hand Program. Everyone else gets their report and enters a nurture sequence.
- **Why it beats the market:** competitors either multiply two guesses (Stealth Agents, Pareto's own homepage slider), ship a spreadsheet with broken totals (BELAY skips its own admin rows), or return a label with no numbers (Athena quiz). We work task by task, optionally read the real calendar, show our math, and hand back a plan.

### Non-negotiables
1. No backend, no login, no database. Static React app on Vercel.
2. Every formula lives in one pure module and is covered by unit tests.
3. Calendar data never leaves the browser.
4. Only official Pareto numbers on the page (listed in §6). Our own estimates are editable and labeled "estimate".
5. Mobile-first, keyboard accessible, `prefers-reduced-motion` respected.

---

## 2. Stack

- React 18 + Vite + TypeScript (strict)
- React Router (routes in §3)
- Vitest + @testing-library/react
- Recharts (charts)
- `ical.js` (parse .ics files, expand recurring events)
- `fflate` (unzip Google Calendar exports in-browser)
- `@react-pdf/renderer` (client-side PDF, **lazy-loaded** on click)
- `lz-string` (compress report state into the URL)
- CSS: plain CSS modules. No Tailwind defaults look. Design tokens in §8.
- Config via env vars: `VITE_GHL_FORM_ID`, `VITE_GHL_CALENDAR_ID`, `VITE_SITE_URL` (see `.env.example`).
- Deploy: Vercel (static). `vercel.json` with SPA rewrite to `index.html`.

---

## 3. Routes and flow

```
/            Landing page (sells the calculator)
/calculator  4-step wizard + gate (HighLevel form)
/next        Router page: reads qualification, sends to /book or /thanks
/book        Qualified: report link + embedded booking calendar
/thanks      Not qualified: confirmation + report link + next steps
/report      Shareable report rebuilt from ?d=<compressed state>
```

```
Ad (utm_*) → /  → /calculator
   step 1 About you → step 2 Tasks → step 3 Calendar (optional) → step 4 Preview
   → gate: HighLevel form (prefilled) → submit → /next
       qualified     → /book    (booking calendar)
       not qualified → /thanks  (report + nurture)
   HighLevel workflow emails the report link to everyone.
```

---

## 4. The wizard (/calculator)

Progress bar with 4 steps. State in a reducer; persisted to `sessionStorage` so a refresh doesn't lose work.

### Step 1 — About you (≈60 s)
- First name (used to personalize the report; not sent until the gate).
- Role: `Founder / Owner` · `CEO (not owner)` · `Executive` · `Other`.
- Annual revenue: `< $250K` · `$250K–$500K` · `$500K–$1M` · `$1M–$5M` · `$5M–$20M` · `$20M+`.
- When do you want help: `Now` · `Within 90 days` · `3–6 months` · `Just exploring`.
- Weekly hours worked (slider 30–80, default 55). Used in step 2 for soft notices (see below), never as an error.
- **Your effective hourly rate** (number, default $200, same default as paretotalent.com). Helper link "Not sure?" opens a mini calculator: `yearly income or profit target ÷ (weekly hours × 48)`.

### Step 2 — Your tasks (≈3 min)
- Task library from §7, grouped by the 7 library areas.
- 14 tasks preselected with default hours (the ✓ rows in §7). Each row: task name, hours/week slider (0–10, step 0.25), "a Right Hand could take" slider (0–100%, default from library), badge "needs your approval" when flagged.
- "Add a task" (custom name, hours, %). Name max 40 chars; HTML and control characters stripped.
- Soft notices (informational, not errors), based on total task hours vs. weekly hours from step 1:
  - task hours > weekly hours → "Your tasks add up to more than the hours you work. Worth a second look."
  - task hours > 80% of weekly hours → "That leaves almost no time for the work only you can do."
- Live sidebar (sticky on desktop, bottom sheet on mobile): delegable hours/week updating as they move sliders. This live number is the hook; animate only this value (no other motion).

### Step 3 — Calendar X-ray (optional, ≈2 min)
- Two buttons: **"Skip, I'm done"** (default focus) and **"Add my calendar for a sharper result."**
- Explainer: how to export from Google Calendar (Settings → Import & export → Export) and Outlook, in 3 short steps with screenshots placeholders.
- File input accepts `.ics` and `.zip` (Google exports a zip; unzip in-browser with `fflate` if zip).
- Privacy line, visible: "Your calendar is read inside this browser tab. Nothing is uploaded or stored."
- Processing rules in §5.3. Output: heatmap + 3 stats, and suggested hours for "Scheduling & rescheduling" and "Meeting prep & follow-ups", which the founder can accept into step 2 with one click.

### Step 4 — Preview + gate
- Show **headline numbers fully**: delegable hours/week (range), what that time costs per month and per year, and a blurred preview of the roadmap and task map.
- Gate copy: "Your full report and 90-day plan are ready. Where should we send them?"
- Embed the HighLevel form (§9) with all known values prefilled.
- Before rendering the form, compute qualification (§5.5) and store `{qualified, tier, reportUrl}` in `sessionStorage`.

---

## 5. Engine (`src/engine/*.ts`, pure functions, 100% unit-tested)

### 5.1 Constants (official, from paretotalent.com, do not change without a source)
```ts
export const WEEKS_PER_MONTH = 4.3;          // Pareto ROI section: $200 × 12.5 × 4.3 = $10,750
export const PARETO_BENCHMARK_HRS = { low: 10, high: 15, used: 12.5 }; // founders save 10–15 hrs/wk in month 1
export const PROGRAM_MONTHLY_ANNUAL_PLAN = 3000; // $36,000/yr
export const PLACEMENT_FEE = 3000;
export const YEAR1_ALL_IN = { annual: 39000, quarterly: 43000, monthly: 46200 };
export const FREEDOM_40_HOURS = 40;          // hours back in first 30 days (conditional guarantee)
```

### 5.2 Core math
```ts
delegableHoursWeek = Σ task.hoursPerWeek × task.delegablePct
range = { low: delegableHoursWeek × 0.7, realistic: delegableHoursWeek }   // 0.7 = our conservative factor (ESTIMATE)
monthlyCost  = hours × rate × WEEKS_PER_MONTH
annualCost   = monthlyCost × 12
roiMultiple  = monthlyCost(realistic) / PROGRAM_MONTHLY_ANNUAL_PLAN
year1Net     = annualCost(realistic) − YEAR1_ALL_IN.annual
hoursPerYear = hours × WEEKS_PER_MONTH × 12
```
Rounding only at display time. Money with `Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0})`.

### 5.3 Calendar analysis (`calendar.ts`)
- Parse with `ical.js`; expand recurrences; window = **last 4 complete weeks** before today.
- Drop: all-day events, events marked transparent/free, declined events, events longer than 8h.
- Declined = an `ATTENDEE` matching the calendar owner has `PARTSTAT=DECLINED`. Owner email comes from `X-WR-CALNAME` (Google exports put it there); if absent, fall back to the `ORGANIZER` of the calendar's events.
- Personal filter (excluded from work stats, counted separately): titles matching `gym|doctor|dentist|kids|school|pickup|birthday|dinner|lunch with|vacation|flight|family`.
- Categories by keyword (case-insensitive, first match wins): `client|demo|sales|prospect|discovery` → Client & sales · `sync|standup|1:1|1on1|weekly|team` → Internal · `interview|hiring|candidate` → Hiring · `podcast|recording|webinar` → Content · else → Other meetings.
- Outputs:
  - `meetingHoursPerWeek` (avg)
  - `focusBlocksPerWeek` (avg count of free gaps ≥ 90 min inside 9:00–18:00 on weekdays)
  - `fragmentedHoursPerWeek` (free gaps < 30 min between meetings)
  - `meetingsPerWeek` (avg count of work meetings)
  - `heatmap[7][17]` (Mon–Sun × 17 one-hour slots starting 6:00, 7:00, …, 22:00; minutes booked per slot, averaged, rounded to whole minutes)
  - Suggested hours: `scheduling = meetingsPerWeek × 10 min` and `prepAndFollowUp = meetingsPerWeek × 15 min` (ESTIMATES, editable)
- Must run on a 3-year Google export in < 2 s (only expand inside the window).

### 5.4 Roadmap (`roadmap.ts`)
```
priority = hoursPerWeek × delegablePct × ease        // ease 1–3 from library
sort desc → bucket by cumulative delegable hours:
  Weeks 1–2  : first tasks until ≥ 40% of total, ease ≥ 2 only ("quick wins")
  Month 1    : next tasks until ≥ 75%
  Months 2–3 : the rest
needsApproval tasks never land in Weeks 1–2 (Day 3 rule: money/irreversible actions are granted explicitly).
Tasks that fail the Weeks 1–2 rule are skipped there and keep their sorted position for Month 1.
Ties on priority keep library order (stable sort).
Tasks with 0 delegable hours are not in the roadmap.
```
**Weeks 1–2 is never empty:**
1. If no task passes `ease ≥ 2 && !needsApproval`, promote the highest-priority task that does not need approval (any ease).
2. If every task needs approval, Weeks 1–2 shows a single setup item (no hours): "Give your Right Hand read-only access and a 15-minute walkthrough of your top task."

Each roadmap item gets a one-line handoff tip from the library.

**Task map** (`taskMap`): Keep if `delegablePct < 50%` or `hoursPerWeek = 0`; otherwise Hand off, or Hand off with approval when `needsApproval`.

### 5.5 Qualification (`qualify.ts`)
```
qualified = role === 'Founder / Owner'
         && revenue >= $500K
         && timeline in ['Now', 'Within 90 days']
         && delegableHoursWeek(realistic) >= 10
tier = revenue >= $1M ? 'core' : 'growth'   // only when qualified
```
Return also `reasons[]` (which rule failed) for internal tags, never shown to the user.

### 5.6 Report state + URL (`reportState.ts`)
- Minimal JSON: `{v:1, n:firstName, r:rate, t:[[taskId,hours,pct] | [name,hours,pct,"c"],...], c:calendarSummary|null}`.
- Custom tasks are encoded as `[name,hours,pct,"c"]`; name max 40 chars; HTML tags and control characters are stripped on encode **and** on decode (decoded input is untrusted).
- `lz-string.compressToEncodedURIComponent` → `/report?d=...`. Must stay < 2,000 chars for 25 tasks (test it).
- If the full URL would exceed 2,000 chars, drop the heatmap and keep only `meetingHoursPerWeek`, `meetingsPerWeek`, `focusBlocksPerWeek`, `fragmentedHoursPerWeek`. Test both paths.
- No email, no revenue, no raw calendar events in the URL.

### 5.7 Required tests (`src/engine/__tests__`)
1. **Pareto parity:** rate $200, 12.5 hrs, 100% → monthly $10,750; ROI 3.58× vs $3,000.
2. **No category is skipped:** tasks in every one of the 7 library areas all count in the total (regression for the BELAY bug where admin rows were excluded from totals).
3. Range low = 0.7 × realistic.
4. Qualification truth table (each rule failing alone → not qualified; all pass → qualified; tier boundaries at $1M).
5. Roadmap: approval tasks never in Weeks 1–2; buckets cover 100% of hours; stable ordering on ties; both Weeks 1–2 fallbacks (promoted task, setup item).
6. Report URL round-trip (encode → decode equals input) and length < 2,000 chars with 25 tasks, both with full heatmap and with heatmap dropped; custom task names sanitized on encode and decode.
7. Calendar: fixture `.ics` with recurring weekly sync, a declined event, an all-day event and a "Dentist" event → expected stats.
8. Edge cases: zero tasks, rate 0, hours 0 → no NaN anywhere.

`npm test` must pass in CI before deploy (add a GitHub Action: install, test, build).

---

## 6. Copy rules and official numbers

Only these figures may appear on public pages (source: paretotalent.com, Day 1/10 decks):
100+ founders served · 93% still together at 12 months · 4.9 Google rating · 1 in 1,000 applicants placed ·
3 hand-picked candidates in 24 hours · 40+ hours of training · 250+ Right Hands in the network ·
founders save 10–15 hrs/week in month 1 · Annual plan $36,000/yr ($3,000/mo) + $3,000 placement ·
Pains: 80% drowning in admin, 70% no time/no life, 60%+ burned by a VA, 50% runs from memory, 40% things fall through, 30% too many hats.

Also approved (source: paretotalent.com pricing and guarantees sections):
- **Year 1 all-in:** $39,000 annual · $43,000 quarterly · $46,200 monthly (each includes the $3,000 placement fee).
- **Matching Guarantee:** 3+ hand-picked candidates; if none feels right, you owe nothing; no contract until you find your person.
- **Freedom 40 Guarantee:** only ever shown with its conditions: attend the Delegation Mastermind, follow the onboarding plan, meet your Right Hand 10 minutes daily. If you don't get at least 40 hours back in your first 30 days, your next month is free.
- **Lifetime Replacement:** if the match is ever not right, Pareto replaces your Right Hand at no cost.

Rules:
- Keep "60%+" with the plus.
- Never call Tim Bratton "the first client". Never mention MP3/Spotify.
- No em dashes in public copy.
- One footnote line under results: "Estimates based on your inputs and Pareto Talent client data." Nothing more on the page.
- Testimonials: verbatim from paretotalent.com/wall-of-love only, with name and title exactly as below. Do not edit the wording (including em dashes or punctuation inside quotes).
  - "My executive assistant Marina came from Pareto Talent and is just a world-beater. The best EA I have ever had." Justin Donald, Founder of Lifestyle Investor
  - "My executive assistant runs point on critical projects and keeps track of so many endless opportunities. I recommend them on a frequent basis." Joe Polish, Founder of Genius Network
  - "I just can't even imagine not having my EA right now. I can't fathom a world where she's not a big part of it." Jon Vroman, Founder of Front Row Dads
  - "Mariela is doing wonderful! It's only day 2 and I am already feeling such a relief that I have her during this crucial time in my business. She is eager, learns fast, and is accurate. I know it's early but I can already tell this was a great decision." Daneen Goncalves, matched to Mariela, September '25
  - "I've had three different executive assistants before, and I thought it was me, right? I was burning through them. They just weren't up to the task. I think I really connected with Agustina, she has a lot of creativity, able to be the self-starter as well. She's not afraid to take things on and figure them out with guidance, which is really helpful." Eric Ritter, matched to Agustina
  - "I'm so happy with the decision, I can't imagine going back to like pre-Paula, or pre-an EA." Bo Royal, matched to Paula

---

## 7. Task library (`src/data/tasks.ts`)

Defaults are ESTIMATES (editable by the user). `pre` = preselected. `appr` = needs approval. `ease` 1–3.

| id | Area | Task | Default h/wk | Delegable | Ease | pre | appr |
|---|---|---|---|---|---|---|---|
| inbox | Inbox & calendar | Sorting and answering email | 5 | 70% | 3 | ✓ | |
| sched | Inbox & calendar | Scheduling and rescheduling meetings | 2 | 90% | 3 | ✓ | |
| travel | Inbox & calendar | Booking travel | 1 | 90% | 3 | ✓ | |
| brief | Inbox & calendar | Preparing for meetings | 1.5 | 60% | 2 | ✓ | |
| followup | Projects & follow-through | Follow-ups after calls | 1.5 | 80% | 3 | ✓ | |
| tracker | Projects & follow-through | Tracking projects and open loops | 1.5 | 80% | 2 | ✓ | |
| vendors | Projects & follow-through | Managing vendors and contractors | 1 | 70% | 2 | | |
| research | Projects & follow-through | Research and comparing options | 1.5 | 80% | 2 | ✓ | |
| crm | Systems & automation | Updating the CRM | 1 | 90% | 3 | ✓ | |
| reports | Systems & automation | Rebuilding weekly reports | 1 | 90% | 2 | ✓ | |
| sops | Systems & automation | Documenting processes (SOPs) | 1 | 80% | 2 | | |
| ai | Systems & automation | Setting up AI tools and automations | 1 | 80% | 1 | | |
| content | Content & comms | Drafting posts and newsletters | 1.5 | 60% | 2 | ✓ | |
| decks | Content & comms | Building decks and proposals | 1 | 70% | 2 | | |
| social | Content & comms | Scheduling social media | 0.5 | 90% | 3 | | |
| invoices | Money & admin | Sending invoices and chasing payments | 1 | 80% | 2 | ✓ | ✓ |
| expenses | Money & admin | Expense reports and receipts | 0.5 | 90% | 3 | ✓ | |
| subs | Money & admin | Managing subscriptions and renewals | 0.5 | 90% | 3 | | ✓ |
| payroll | Money & admin | Payroll and payments | 0.5 | 50% | 1 | | ✓ |
| hiring | Team & clients | Screening candidates | 1 | 60% | 1 | | |
| onboard | Team & clients | Onboarding new hires | 0.5 | 60% | 1 | | |
| clientcomms | Team & clients | Routine client updates | 1 | 50% | 2 | ✓ | |
| personal | Personal | Personal appointments and gifts | 1 | 90% | 3 | ✓ | |

The library has **7 areas**, and the UI groups tasks by them: Inbox & calendar · Projects & follow-through · Systems & automation · Content & comms · Money & admin · Team & clients · Personal.
They are derived from Pareto's six Right Hand areas (Day 1: Inbox & calendar · Second Brain/knowledge · Projects & follow-through · Systems & automation · Content & comms · Client-facing work): Second Brain is covered by the SOPs and research tasks, Client-facing work by "Team & clients". "Money & admin" and "Personal" come from tasks listed on paretotalent.com.

Each task also has `tip` (one-line handoff advice) for the roadmap, e.g. inbox → "Start with labels and a daily summary; let your Right Hand draft, you send."

---

## 8. Design direction

**Subject:** a founder's week, and getting hours of it back. The signature element is **the week itself**: a Mon–Sun grid of hour cells. In the hero it fills with amber "leak" cells; as the visitor scrolls (or, in the app, as they move sliders) cells turn emerald, "handed off". Spend all the boldness here; everything else stays quiet.

Tokens (Pareto brand accent kept; rest chosen for this brief):
```
--forest   #0E2A22   primary dark (headers, hero background)
--emerald  #10B981   Pareto brand: "handed off" hours, primary buttons
--amber    #E39B2D   "leak": hours still on the founder's plate
--mist     #EEF4F1   page background (cool, slightly green, not cream)
--ink      #14211C   body text
--slate    #5B6B64   secondary text
```
Type:
- Display: **Bricolage Grotesque** (600/700), tight tracking on large sizes.
- Body + numbers: **Public Sans** (400/600) with `font-variant-numeric: tabular-nums` for every figure.
- Scale (1.25): 14 / 16 / 20 / 25 / 31 / 39 / 49 / 61. Body 16–18px, line length ≤ 70ch.

Rules (avoid templated tells):
- Sentence case everywhere; no ALL-CAPS eyebrow labels; no single highlighted word in headlines; no "→" on buttons.
- Numbered markers only where it's a real sequence (wizard steps, roadmap phases).
- Not every block is a rounded card with a grey shadow. Radius: 14px on interactive controls, 4px on data cells, 0 on full-bleed sections.
- One orchestrated motion: the week grid in the hero. Everything else static except value changes the user triggers.
- Buttons say what happens: "Start the calculator", "Send me my report", "Book my matching call".

---

## 9. HighLevel integration (no backend)

### Form: `FP | Francisco Allende | Qualifying Form`
Visible fields (prefilled from the wizard, user can confirm): First name · Last name · Email (required) · Phone (optional) ·
Role · Annual revenue · Timeline (dropdowns with the exact same options as step 1).
Hidden fields (custom fields, populated by URL query params):
`fft_delegable_hours`, `fft_hours_low`, `fft_monthly_cost`, `fft_annual_cost`, `fft_roi_multiple`, `fft_top_tasks` (top 3 names), `fft_report_url`, `fft_qualified` (yes/no), `fft_tier`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`.
- Embed with HighLevel's iframe + `form_embed.js`. Build the iframe `src` with `URLSearchParams` (query keys = each field's query key in GHL).
- On submit → redirect to `https://<domain>/next`.

### /next
Reads `sessionStorage` (`qualified`, `reportUrl`). If the page loaded inside the iframe, break out with `window.top.location.replace(...)` (same origin after redirect). Fallback if storage is empty: `/thanks`.
**Verify in the real account:** that the redirect lands on `/next` and the top window navigates.
The fallback is built from day one: after a successful submit message, the gate shows a "Continue" button that navigates to `/next`, in case GHL keeps the redirect inside the iframe and breakout fails.

### UTM capture
On first load of any page: read `utm_*`, store in `sessionStorage` (first touch wins), pass to the form as hidden fields. Each of the 5 ads gets its own `utm_content` (`ad1-bottleneck`, `ad2-burned`, `ad3-expert`, `ad4-alwayson`, `ad5-hats`).

### Workflows (built in GHL, documented here for the Business Map)
- **Opt-in:** trigger form submitted → If/Else on Revenue + Role + Timeline + `fft_delegable_hours` (same rules as §5.5; the app's `fft_qualified` is a cross-check) → tag `fp-fa-qualified` (+ `fp-fa-core`/`fp-fa-growth`) or `fp-fa-unqualified` → create opportunity in matching stage → internal notification to Francisco only → Email 1 with `{{contact.fft_report_url}}` to everyone.
- **Qualified follow-up (3 emails, stops if booked).** **Unqualified nurture (3 emails).** **Booking:** confirmation + reminder.
- All workflows OFF after testing.

---

## 10. Pages

### / Landing (Part 6 order)
1. **Hero:** title, subtitle, primary button "Start the calculator", proof above the fold (100+ founders · 93% at 12 months · 4.9 rating), the animated week grid.
2. **The problem:** the six pains with Pareto's percentages; line "Recognize three or more? It's not a productivity problem. It's a structural one."
3. **What's inside:** hours you can hand off (range) · what they cost you · your task map · your 90-day handoff plan · optional calendar X-ray · downloadable PDF.
4. **Who it's for:** founders and owners doing $500K+ who are the bottleneck; 3 persona snippets in client words.
5. **How it works:** 1 pick your tasks · 2 (optional) add your calendar · 3 get your report.
6. **Proof:** 3–4 Wall of Love quotes verbatim + Pareto numbers.
7. **Why trust the math:** "Every formula is tested. See the method." (link to a short method section on /report).
8. **FAQ:** Is my calendar uploaded? (no) · How long does it take? · Is this a sales trick? (the report is yours either way) · What's a Right Hand?
9. **Final CTA.**
Footer: "A Pareto Talent resource" + link to paretotalent.com.

### /report
Rebuilt from `?d=`. Sections: summary numbers (range) · chart: your week today vs with a Right Hand (stacked bar by area) · chart: 12-month cumulative hours and dollars · task map (Keep / Hand off / Hand off with approval) · 90-day roadmap timeline · calendar X-ray (if present) · method (formulas + assumptions, collapsible) · CTA to book.
Button **"Download PDF"** → lazy `import('@react-pdf/renderer')`, render `ReportDocument` (same data, Pareto styling, selectable text, 2–3 pages). File name `Founder-Freedom-Report-<FirstName>.pdf`.

### /book (qualified)
Headline: "Your report is on its way. Let's match you with a Right Hand who can take these hours." · top 3 tasks from their report · embedded GHL calendar `FP | Francisco Allende | Matching Call` · what happens on the call · 3 candidates in 24h · Matching Guarantee (wording from §6) · link to view report now.

### /thanks (not qualified)
Day 8 thank-you anatomy: **confirmation** ("Your report is in your inbox in about 2 minutes") · **next steps** (open report, try the first 2 quick wins this week) · **support** (reply to the email) · **objection handling** (short "When does a Right Hand make sense?" + link to paretotalent.com) · view report button.

---

## 11. Repo layout
```
src/
  engine/ constants.ts types.ts math.ts format.ts calendar.ts roadmap.ts qualify.ts reportState.ts sanitize.ts __tests__/
  data/ tasks.ts options.ts copy.ts testimonials.ts
  state/ wizard.ts
  styles/ tokens.css global.css
  components/ WeekGrid/ ProgressBar/ TaskRow/ AddTask/ LiveTotal/ RateHelper/ Heatmap/ Charts/ Roadmap/ TaskMap/ GateForm/ ReportPdf/ Faq/ Footer/
  pages/ Landing.tsx Calculator.tsx Next.tsx Book.tsx Thanks.tsx Report.tsx calculator/
  lib/ utm.ts storage.ts ghl.ts unzip.ts
public/ og-image.png favicon.svg
.github/workflows/ci.yml  vercel.json  .env.example
```

## 12. Acceptance checklist
- [ ] `npm test` green; GitHub Action runs tests + build.
- [ ] Lighthouse mobile ≥ 90 performance and accessibility on `/` and `/calculator`.
- [ ] Full flow < 7 min for a first-time user skipping the calendar.
- [ ] Qualified test (Founder, $1M–$5M, Now, ≥10h) → `/book`; unqualified test → `/thanks`.
- [ ] GHL contact shows all hidden fields filled, correct tags, opportunity created.
- [ ] Email arrives with a working report link that rebuilds the same numbers.
- [ ] PDF downloads with selectable text.
- [ ] Calendar file from a real Google export processes locally; DevTools Network shows no upload.
- [ ] Every public link opens in an incognito window.

---

## 13. Decisions log

**2026-10-03** (resolving gaps found in the first read of this spec)
1. Preselected tasks: 14 (the ✓ rows in §7), not 15.
2. Areas: UI groups by the 7 library areas; test 2 asserts every library area counts toward the total.
3. Custom tasks in the URL: `[name,hours,pct,"c"]`, name ≤ 40 chars, HTML/control chars stripped on encode and decode.
4. URL length: heatmap rounded to whole minutes; if the URL still exceeds 2,000 chars, drop the heatmap and keep the 4 summary stats. Both paths tested.
5. Heatmap: 17 one-hour slots starting 6:00 through 22:00.
6. Declined events: owner email from `X-WR-CALNAME`, fallback `ORGANIZER`. `meetingsPerWeek` added to the calendar summary.
7. Task map: Keep if pct < 50% or hours = 0; else Hand off / Hand off with approval.
8. Roadmap Weeks 1–2 is never empty: promote the top non-approval task; if all tasks need approval, show the setup item.
9. Year 1 all-in prices, Matching Guarantee, Freedom 40 Guarantee (with conditions only) and Lifetime Replacement approved for public pages (§6).
10. Testimonials fixed verbatim in §6.
11. GHL IDs and domain via env vars; "Continue" fallback in the gate built from day one.
12. CSS modules.
13. Soft notices in step 2 when task hours exceed weekly hours or 80% of them.
