# Owner calendar redesign — 3 November 2026

Implemented locally at `/admin/availability`. Existing uncommitted admin/responsive work is retained; its starting diff is preserved privately under `.local/calendar-redesign-20261103/`. No production booking, closure, settings, payment or notification was changed. No migration, dependency, commit, push or deployment was added.

## Owner interface

- Full content width, compact Today/previous/date picker/next/7-day/14-day/Add booking toolbar. Desktop starts with fourteen nights; phones start with a daily room agenda and a seven-day grid alternative. Agenda navigation moves one day; grid navigation moves the selected period. Room-category grouping is under View options and appears only for shared categories; physical units remain separate rows.
- Quiet available cells, continuous checkout-exclusive stay bars, separate lanes for overlapping records, teal confirmed stays, amber pending/holds and patterned closures. Today/weekends are marked. Room names and date headers stick within the bounded calendar scroller. Existing physical-unit names are used; duplicate titles include their existing room number. Categories remain secondary labels, not invented unit assignments.
- Booking details, date selection and closure controls use a keyboard-trapped contextual drawer with Escape and focus return. Selection supports desktop dragging, click + Shift-click, Shift-arrow, Enter and editable date fields. Accessible cell labels include room, date and availability. Drawers scroll on small/reduced-height viewports.
- Selected dates link to the existing manual-booking form with validated category/check-in/checkout query parameters. No reservation is created by selection. The existing API allocates by **room category**, so an exact physical unit is not promised; that limitation is explained before opening the form.
- Close room has one internal note, reason, explicit inclusive last closed night, affected-night count and reopen date. Failed submissions retain entries. Rapid duplicate submissions are guarded. Existing booking/overlap validation still runs server-side; recognized conflicts produce clear messages. Reopening requires explicit confirmation, keeps history via the existing archive update, and remains limited to manual closures. Connected-calendar closures are read-only here.
- Existing `from`, `view=room|type`, `blockStart`, `blockEnd` and `#block-dates` links remain supported. Legacy block end dates remain inclusive. Dates outside the loaded period are explicitly marked as requiring server revalidation.

## Data and permissions

Owner/manager/staff checks and property scoping remain in place. Existing booking creation, allocation, pricing, closure validation and database locking/guards were not replaced or weakened. Booking stays remain `[check-in, checkout)`; closure dates remain inclusive. Calendar “today” and hold timestamps use Europe/Tirane, while date arithmetic uses date-only UTC operations to avoid DST day shifts.

Summary indicators query actual booking/guest data for today independently of the viewed calendar period. Arrivals/departures open matching booking links in the drawer. Occupied tonight counts distinct allocated units for confirmed/checked-in stays; pending holds are not counted as occupied guests. Completed departures are included. Unassigned category inventory is explicitly flagged rather than converted into a fabricated room count or placed on an arbitrary physical unit. Booking-level guest totals are labelled as totals, not per-unit occupancy.

The operational grid retains the existing active booking-status scope, including live holds; expired holds stop occupying cells without rewriting their records. Historical booking data remains in the existing booking-management flow. No automatic hold cancellation or history cleanup was introduced.

## Verification

- `npm test`: **220 passing tests**, including meaningful date/span, turnover, hold expiry, type-versus-unit, timezone, prefill-link and repository conflict/tenant/archive checks.
- TypeScript, ESLint and production build pass.
- Installed Chrome local fixtures at **360, 390, 768, 1024, 1440 and 1920px**, plus reduced 420px viewport-height checks: adjacent/multi-night bars, sticky unit names, selection and editable ranges, keyboard focus/return, closure conflict/retry, rapid duplicate submits, confirmed reopen, hold expiry while details are open, month/year navigation, populated/empty states and booking-form prefill. Category grouping and legacy hash/inclusive-date links are also checked. All fixture network access is blocked.
- Screenshots visually inspected: [desktop](../.local/calendar-fixture-v1/initial-1440.png), [mobile agenda](../.local/calendar-fixture-v1/initial-390.png), [mobile drawer](../.local/calendar-fixture-v1/drawer-390.png). Yellow banners identify synthetic data; surrounding desktop navigation uses the actual sidebar source.

Reproduce the isolated browser checks:

```sh
BOREALIS_BOOKING_FIXTURE=1 node tools/calendar-fixture/browser-tests.mjs
```

Private logs and source/hash manifests are in `.local/calendar-redesign-20261103/` and `.local/calendar-fixture-v1/`. These are component/action-fixture checks, not a normal signed-in hosted acceptance or a live database concurrency test. Actual mobile keyboards/native picker popups remain device checks. No claim is made that pre-existing database race behavior was newly certified; the existing server checks and database protections remain authoritative.
