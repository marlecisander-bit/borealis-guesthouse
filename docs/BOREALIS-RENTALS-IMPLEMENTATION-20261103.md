# Experiences catalogue and equipment rentals — 3 November 2026

Release follow-up: see [the controlled release record](BOREALIS-RENTALS-RELEASE-20261103.md). The original implementation-only state and future steps below describe the earlier handoff; migrations 040/041 and inactive draft preparation have since been completed.

## Scope and current state

Implemented locally on `main`, based on published revision `1dc2e2569f1fd00ebfb74b7459d776b28e8986e9`. The working tree was clean before this task. The existing Netlify site publishes from this repository's main branch. **No commit, push, production migration, catalogue write, payment-provider action or deployment was performed in this task.** No additional Supabase project or hosted environment was created.

The existing `bookings`, `booking_items`, guest, hold, confirmation and notification architecture remains authoritative. Dinner, rooms and transfers keep their existing models. Rental equipment reservations are child records of existing booking items, not a second booking engine.

## Implementation

- `rental_config` on experiences holds owner-editable equipment, occupancy, prices, charging units, durations, operating days/hours, daily collection/return, date overrides, maintenance, cutoff, buffers, booking switches, fuel, policies, extra charges, beach applicability and payment instructions. The existing authenticated form now exposes slug and display order as well as these grouped rental fields. Category is configurable for rental products. Existing media selectors are retained.
- Public catalogue cards use managed content and existing media in an aligned responsive grid. Enabled hourly/daily prices appear together, with a per-equipment charging unit, occupancy and visible fuel exclusion. Product details and checkout show defined restrictions, charges and expandable policies. No production photographs were generated or added.
- Standalone rental checkout and optional room add-ons share `RentalPicker`, current server quotes and the same allocation guard. The room wrapper delegates room, dinner and transfer work to the established multi-room package allocator, then adds rental lines in the same transaction. Existing confirmation endpoints are reused.
- Every rental insertion takes the same property advisory lock used for room inventory, checks full intervals and allocates verified active equipment. Daily and hourly reservations compete for the same units. Turnaround, maintenance, closures, seasonal windows and cutoff apply to both routes. Business dates/times use Europe/Tirane. Boat dates need an explicitly reviewed daylight schedule; the default 21:00 closing is not treated as safe all year.
- Prices, quantity, participants, duration, collection/return, extras, fuel explanation, policies, advance instructions and configuration version are snapshotted on the booking item. Browser prices are ignored. Snapshots cannot be rewritten by subsequent settings changes. Cancelled/expired holds release inventory without deleting history. Expired confirmations and hold extensions cannot reclaim released units.
- Confirmation pages, owner booking details, existing in-app notifications and email templates show rental details and separately payable amounts. Internal equipment labels are excluded from public component props; allocation keys are stripped from public confirmation metadata.
- Cash, POS and manually verified advance receipts use an authenticated, tenant-checked, idempotent receipt RPC. Owner/manager/staff may record funds actually received; a guest's selected method never marks a booking paid. Partial amounts retain pending payment status and expose received/balance amounts. Booking lifecycle remains separate. This receipt UI is limited to bookings containing rental items; legacy payment statuses require reconciliation rather than automatic conversion.
- Online payments are deliberately unavailable. There is no verified payment-provider integration in this repository. The type/configuration/API boundaries reject online activation and selection. A provider choice, merchant setup, server credentials, verified webhook implementation, idempotent provider event handling and sandbox acceptance are still needed before online payments can be offered. Do not put credentials in chat or source.

## Draft catalogue and owner decisions

`src/lib/rentals/catalogue.ts` defines reviewable starting values, not public hardcoded card prices:

| Product | Verified active units | People per item | Hourly EUR | Daily EUR |
| --- | ---: | --- | ---: | ---: |
| Boat | 1 | 5, owner review required | 20 | 50 |
| SUP | 3 | Unset until confirmed | 5 | 10 |
| Single kayak | 1 | 1, owner review required | 5 | 15 |
| Double kayak | 2 | 2 adults OR 1 adult + 1 child | 10 | 25 |

Two additional double kayaks remain inactive and unverified. They do not increase available inventory or imply four-person family capacity. Daily collection/return defaults to 10:00–21:00 with a mandatory review flag. Hourly rentals use whole hours. No rental booking switch is enabled in the starting catalogue.

Before publication, confirm occupancy, including SUP capacity and permitted adult/child participation. Before enabling bookings, configure meeting point, collection/return, cancellation and bad-weather instructions, safety rules, payment methods and daily hours. Boats additionally require fuel instructions and reviewed date ranges with safe daylight closing. Decide any minimum age/weight limits. Late-return and damage/deposit terms remain unset unless the owner defines them; undefined charges are not collected. Review inclusions/exclusions and use existing media for each product.

The beach entry starting fee is EUR 5/person. Applicability to activity renters and children remains `unresolved`: no automatic entry fee is collected. The owner may explicitly choose no renter charge, non-staying adults, or all non-staying participants. A room package proves staying status, but a standalone booking does not prove non-staying status. Configured non-staying entry fees are displayed as conditional, separately payable amounts and are excluded from automatic rental totals until staff verifies eligibility. Automatic collection would require a verified stay-status integration; a browser claim is insufficient.

The optional catalogue SQL inserts missing products only as inactive drafts and skips matching existing records, including Paddle Rental. It does not change existing names, descriptions, prices, photos, bookings or dinner. Reuse a matching Paddle Rental record through Admin and explicitly review its new rental configuration. Conversion is rejected if future active legacy reservations remain; resolve those through the normal owner workflow, not by rewriting reservations or forcing the guard. Historic legacy items retain their original semantics.

## Validation and limits

- All 207 `npm test` tests pass, including execution of the actual migration in PGlite PostgreSQL fixtures, interval overlap, occupancy, buffers, closures, cutoff, tampering, shared inventory, cancellation/expiry, immutable snapshots, payment permissions/idempotency, draft catalogue preservation and schema-drift aborts.
- TypeScript, ESLint and normal Next.js production build pass.
- A separate disposable native PostgreSQL 18.6 cluster exercised three real connections. The competing room request was observed waiting on an advisory lock; after commit, it failed without a partial package. Simultaneous last-unit attempts yielded one allocation. Expiry release and rejection of expired confirmation also passed. The loopback-only test cluster was stopped and its database removed.
- Headless Chrome tests at 390×844, 768×1024 and 1440×900 passed for aligned cards, hourly/daily standalone selection and review, room add-ons, confirmation navigation and owner rental controls. No horizontal overflow, page errors or outbound network requests occurred. Screenshots were visually inspected. Existing room fixture regression tests are also part of the local verification.
- Browser availability, room pricing, images and confirmations were explicitly synthetic. SQL tests use a minimal legacy-contract schema; the old room allocator boundary and membership helper are fixture implementations. This is not a claim of a live Supabase/PostgREST/SSR session or payment-provider integration test. Existing authenticated roles, actual media and hosted runtime compatibility still need an authorized release acceptance check before rentals are enabled.

Private logs/screenshots and receipts are under `.local/rental-fixture-v1/`, `.local/rental-native-results.json` and `.local/publish-20261103/rental-*.log`. They are excluded from Git.

## Reproduce local verification

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
BOREALIS_BOOKING_FIXTURE=1 node tools/rental-fixture/browser-tests.mjs
BOREALIS_BOOKING_FIXTURE=1 node tools/booking-fixture/browser-tests.mjs
node scripts/prepare-rental-catalogue.mjs
```

Browser fixture scripts use the installed macOS Chrome executable. They do not start the app or contact Supabase. PGlite is a test-only development dependency in the lockfile.

For the optional native race test, install its pinned binary runtime under the ignored local directory, then run the script. It creates only a new disposable loopback cluster and never reads project dotenv files:

```sh
npm install --prefix .local/rental-native-runtime --no-audit --no-fund embedded-postgres@18.6.0-beta.19
node scripts/test-rental-concurrency.mjs
```

## Exact future migration and publication steps

These steps are prepared for a later authorized release; none was executed here.

1. Review the final source diff, migration 040 and draft seed against the current existing project and its live schema. Confirm the current migration baseline through 039 and an appropriate recoverable backup using the established project procedure. In particular, compare the existing experience guard and booking confirmation definitions: migration 040 verifies their normalized bodies and aborts on unexpected changes. It also requires database/user `postgres`, uses bounded lock/statement timeouts, and runs in one transaction. Do not relax a failed drift guard without reviewing the actual difference.
2. Apply only `database/migrations/20261103_040_equipment_rentals.sql` to the existing project. The script adds rental columns/tables/functions/triggers and extends the last-published legacy guard/confirmation; it does not seed content. Do not replay historical migrations or SQL proposals. Keep any database connection string in the private operator environment. Example, after target verification:

   ```sh
   psql "$BOREALIS_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f database/migrations/20261103_040_equipment_rentals.sql
   psql "$BOREALIS_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f database/tests/rental_release_postcheck.sql
   ```

   The postcheck is read-only. Expect RLS on both new tables, no anonymous/authenticated direct allocation or receipt writes, no public private-helper execution, public quote/hold RPC execution and authenticated receipt RPC execution with internal membership enforcement.
3. Optionally run the reviewed draft-only catalogue setup with the explicitly verified existing property UUID. This is a psql script with variables, not an unchanged SQL-editor paste:

   ```sh
   psql "$BOREALIS_DATABASE_URL" -X -v ON_ERROR_STOP=1 -v property_id=REVIEWED_PROPERTY_UUID -f database/seeds/20261103_rental_catalogue.sql
   ```

   Inspect the resulting draft/existing-product list. Matching existing Paddle Rental is skipped and should be configured in place. No existing product or reservation is overwritten. The seed is repeatable.
4. Complete an authorized acceptance check through actual owner/editor/staff sessions and PostgREST: verify quotes, tenant/role denials, a bounded rental hold/confirmation/cancellation, room-package coexistence, receipt recording, snapshots and notifications with approved synthetic data. Check provider-delivery settings before creating fixtures. Confirm the hosted PostgreSQL/runtime version; the native local concurrency test used PostgreSQL 18.6. Keep rental products inactive until accepted.
5. Prepare a reviewed commit and publish to the existing main/Netlify release path only in a later explicitly authorized task. Main auto-publishes. Migration 040 must precede this application release because readers use the new column and endpoints use the new RPCs. Confirm no read-only-preview variables are set on hosting.
6. In Admin, reuse existing media/content, complete the owner decisions above, publish reviewed products and enable only the intended standalone/room rental modes. Room add-on currency must match the stay currency; the application does not invent an exchange rate. Perform responsive and booking smoke checks on the released revision. Online payment remains unavailable until the separate verified integration is implemented.

For recovery, disable affected rental booking switches and preserve allocation, receipt and snapshot records. The database change is additive for old non-rental products, but older application code does not understand new rental lines: do not serve active rentals through a pre-rental app rollback. Do not drop the new tables or rewrite existing reservations as an automatic rollback.
