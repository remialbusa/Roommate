# Roommate App — Working Web App with Accounts

A React + Vite + Tailwind roommate management app covering all five
features — **Bills**, **Money Lending**, **Notes**, **Calendar**, and
**Activity Log** — as one connected, responsive web app with real
sign-up/login and shared state, so every add / edit / delete / pay
action actually persists (to `localStorage`) and shows up across
features and across page reloads.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). You'll
land on a login screen first.

Use "Sign Up" to create the first account — the app starts empty
with no test users. New sign-ups become real household members and
are immediately selectable in bill splits, loan counterparties, and
event attendees. Add a second member by signing them up (log out,
then sign up again) to split bills and log loans between people.

```bash
npm run build      # production build
npm run preview    # serve the production build locally
npm run smoke       # build + run an automated interaction test (see below)
```

## Automated smoke test

`scripts/smoke-test.mjs` mounts the actual built app in a simulated
DOM (via `jsdom`) and drives it exactly like a user would: signs up
as a fresh user, clicks through all five nav tabs (empty states),
adds a bill/note/event through their real forms, checks validation
blocks bad loans, checks the changes show up in the Activity Log,
opens Settings, logs out — asserting on the actual rendered output
at each step (e.g. the bill total shows $42.00, the new note's title
actually appears in the list). Run it with `npm run smoke`.

This doesn't catch CSS/visual issues (jsdom doesn't paint layout), but
it does catch React crashes, broken event handlers, and wrong data —
the most common causes of a screen silently failing.

## What's actually working

Every visible control performs a real action against shared state
(`src/state/AppStateContext.jsx`), persisted to `localStorage`:

- **Accounts** — Sign up, log in, log out. Sessions persist across
  reloads. The first account to join a household becomes its admin
  (gold Admin badge); only the admin can remove members or manage
  household data. New accounts join the household roster used
  everywhere else in the app.
- **Bills** — one screen: semicircle gauge overview, Add Bill
  (validated split), 1-tap Pay on your own share straight from the
  bill list, All/Rent/Utilities filter. Tap a row for split editing,
  reminders, and delete. Empty states guide first-time setup.
- **Money Lending** — Log/edit/delete loans, Log Repayment/Payment
  (clamped so you can't overpay, updates remaining balance and the
  "Settled" gauge live), Send Reminder. "You're Owed"/"You Owe" open
  real sorted loan lists with settled states.
- **Notes** — Add, edit, delete (two-tap confirm), search across
  titles + body, multiple pinned notes, color tags editable.
- **Calendar** — Add/edit/remove events (validated day, time, color,
  attendees); month grid uses real date math, supports multiple
  events per day with dots, tap empty day to quick-add, sorted
  upcoming list.
- **Activity Log** — Every action above automatically appends a real
  entry here (capped at 200), attributed to the account that did it,
  filterable by category (including "Account" for sign-ups),
  drillable into a per-roommate history, with crash-safe fallbacks
  for unknown categories/users.
- **Settings** — Household roster, currency preference (USD, EUR,
  GBP, JPY, AUD, CAD, INR, PHP — every amount re-renders), reminder
  logging toggle, JSON export, clear-activity and erase-all-data
  actions, plus Log Out.

## Responsive layout

`src/components/AppShell.jsx`: a persistent left sidebar + wide
content column on screens ≥768px, edge-to-edge content with a bottom
tab bar below that. Both read from the same `NAV_TABS` config and the
same feature components — one implementation per screen, not separate
mobile/desktop copies.

## Project structure

```
src/
  theme.js                   — color tokens, months
  state/AppStateContext.jsx  — global state: users, bills, loans, notes,
                                events, activityLog; auth (signUp/logIn/
                                logOut); localStorage persistence
  index.css                  — Tailwind entry + Google Fonts
  App.jsx                    — root: shows AuthScreen or AppShell based on
                                whether someone's logged in
  components/
    AppShell.jsx              — responsive sidebar/bottom-nav shell
    BottomNav.jsx, navTabs.js
    Modal.jsx, FormControls.jsx
    SettingsModal.jsx         — household roster + logout
    IconButton.jsx, ScreenHeader.jsx, Avatar.jsx, Logo.jsx
    ProgressGauge.jsx, BackgroundTexture.jsx
  features/
    auth/        — AuthScreen (login/signup)
    bills/       — Home (gauge overview + filterable bill list with 1-tap pay), BillRow, BillDetail, AddBillModal, SplitBillModal
    lending/     — Home, Balances (gauge + grouped loan lists), LoanRow, LoanDetail, AddLoanModal, PayNowModal
    notes/       — Home, Detail, AddNoteModal
    calendar/    — Home, EventDetail, AddEventModal, data.js (date math)
    activity/    — Feed, RoommateActivity, ActivityRow, data.js (category config)
scripts/
  smoke-test.mjs — automated headless interaction test (see above)
```

## Design tokens

| Token       | Hex       | Use                                  |
|-------------|-----------|---------------------------------------|
| `ink`       | `#123128` | primary dark surface                  |
| `lime`      | `#8FE84F` | positive / paid / owed-to-you accent  |
| `ember`     | `#F0492A` | due / owed / CTA accent               |
| `gold`      | `#F0B90B` | highlight / pinned accent             |
| `cream`     | `#E7E0CB` | page background                       |
| `creamCard` | `#F1ECDC` | light buttons & surfaces              |

Typography: **Space Grotesk** for display/headline text, **Manrope**
for body text.

## Known simplifications / not-yet-built

- **Auth is demo-grade, not production-grade.** Passwords are stored
  in plain text inside `localStorage` state — there's no hashing, no
  server, no session tokens. This is fine for a local prototype but
  must not be shipped as-is; a real backend (hashed passwords, HTTPS,
  server-side sessions) is a prerequisite before any real deployment.
- **Bills/Lending are tracked on one shared household ledger, not
  per-user perspective.** "You're Owed" / "You Owe" reflect the
  loan direction as logged, shared across all members. Making
  balances genuinely perspective-relative per logged-in user is a
  real architecture change (each loan/bill would need a `from`/`to`
  pair instead of an implicit "you").
- State is `localStorage`-only (key `roomie-app-state-v2`) —
  clearing browser storage resets everything to empty. There is no
  test/seed data and no real backend.
