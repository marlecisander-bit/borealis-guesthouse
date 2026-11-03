# Borealis booking engine — local failure investigation

21 October 2026, Europe/Tirane. **Exact local failure reproduced. Root cause: intentionally restricted preview. Booking engine readiness: PARTIAL.** The running preview was not stopped, restarted, replaced, or weakened. No real availability/pricing/booking/Auth/Storage data, SQL, deployment, infrastructure or Netlify setting was changed.

## What failed and why

The requested URL:

```text
http://127.0.0.1:3000/book?checkIn=2026-11-16&checkOut=2026-11-20&guests=2&adults=2&children=0&infants=0
```

returns **HTTP403**, body **`Read-only preview: request blocked.`**, with restrictive CSP. The request is rejected by the preview proxy before BookPage/BookingFlow or availability/pricing code can run. This is not a demonstrated bad date, missing inventory, invalid price, React rendering failure or Supabase outage.

Port3000 belongs to **PID18704**, the ownership-checked Next16.3.4 process launched from:

`.local/readonly-images-v7/runtime-source/`

Executable is the pinned Node20.19.5. Stable PID/start time/group/executable/cwd ownership checks match its existing process record. Served build output is `.next-readonly-preview-v1`, BUILD_ID **`j9MbbfW2J_XqQ4f_A6q_u`**; handoff SHA-256 **`17e9e10f2a5242709590da7d2738e71fa20507760dbcad614b69dcbc6e270796`**. This is the older sealed v7 informational snapshot, not a hot-reloading canonical dev server. Its BookPage, BookingFlow, search validator and preview policy files happen to match current canonical bytes; that does not make its entire build current with subsequent F01/F03 work.

The route allowlist contains only `/`, `/about`, `/rooms`, `/experiences`, `/transfers`, `/explore-koman` and `/gallery`, plus bounded static assets. `/book`, `/api/pricing`, booking/confirmation/admin routes are absent. Only approved GET/HEAD requests and narrow public Supabase table projections are allowed; RPC/Auth/Storage/mutation traffic is rejected. CSP additionally has form-action:none. Changing dates or guest counts cannot make `/book` pass this route boundary.

The sealed launcher/build intent specifies both preview flags=1, NODE_ENV=production, preview distDir, loopback origins, public-only Supabase configuration and blank privileged integrations. Current HTTP behavior confirms that the preview boundary is active. **Direct current process environment values were not observable through the scoped macOS process check**; null results are recorded as unknown, not evidence that flags or credentials are absent. No raw environment dump or credential value was displayed or persisted. Historical successful startup/preflight evidence supplies configuration provenance; there is no fresh claim that every running environment value was independently read. Canonical public configuration shape was separately validated during setup.

Launcher stdout/stderr are routed to DEVNULL, so there is no persistent live request/error log to inspect. Build/start receipts are historical evidence, not substitutes for a runtime stack trace. The deterministic403 response and matching sealed policy explain this reproduction without a production connection.

## Canonical workflow trace and classification

| Step | Classification | Evidence / limit |
| --- | --- | --- |
| Homepage booking widget | Implemented but browser-unverified in this task | BookingSearch uses /book form and hidden dates plus guest-category fields; preview form-action/navigation deliberately prevents booking |
| Navigation to /book | **Blocked by local preview** | Exact GET403; normal Next routing never reached |
| Date/guest transfer and prefill | **Working and verified offline** | Actual BookPage and async configurator pass 2026-11-16→20,2 adults/0 children/0 infants to BookingFlow with autoSearch=true |
| Availability search | Implemented but live-unverified; preview-blocked | bookingService POST /api/pricing; canonical route loads published property/room types and calls available_room_count; no live request/RPC executed |
| Inventory/allocation | **Working with synthetic candidates**, database unverified | Existing single/repeated/mixed-room tests enforce available units, complete party allocation and per-room adult/category rules |
| Pricing | **Working with synthetic JS catalogs**, SQL unverified | Seasonal nightly calculation, minimum stay, mixed currencies tested; actual calculate_room_stay_price not called |
| Room selection | Reducer verified; browser interaction unverified | Actual reducer advances selected accommodation to step2 and invalidates stale selection on search changes |
| Multi-room selection | Synthetic allocation verified; live/UI unverified | Existing allocation tests cover mixed/repeated rooms and insufficient inventory |
| Adults/children/infants | **Working and verified offline** | Valid counts preserved; invalid dates, negative/fractional categories, no adults and inconsistent totals reject; guest category synchronization tested |
| Booking hold | Implemented but **NOT TESTED live** | create_multi_room_booking_package_hold via /api/bookings/hold; guest/allocation validation exists; failures mocked only |
| Guest information | Implemented; reducer partially verified; form/browser unverified | GuestForm fields and hold route validation traced; no real guest data entered/read |
| Confirmation | Implemented but **NOT TESTED live** | /api/bookings/confirm calls confirm_booking_hold and schedules notification dispatch; neither action invoked |
| Cancellation / inventory release | Implemented admin transition/SQL path, **unverified** | Admin repository supports cancelled status; reservation propagation/expiry behavior not exercised. No guest self-cancellation endpoint identified in the bounded app-route trace |
| Admin booking visibility | Implemented but **unverified** | Property-scoped admin repository list/detail and authenticated admin routes exist; no account/booking records queried |

Relevant code: `src/components/public/BookingSearch.tsx`, `src/app/book/page.tsx`, `src/components/booking/BookingFlow.tsx`, `src/hooks/useBooking.ts`, `src/services/booking.ts`, `src/app/api/pricing/route.ts`, booking hold/confirm routes, booking allocation/occupancy/pricing modules, and `src/lib/repositories/admin/bookings.ts`. The environment restriction is in `src/proxy.ts` and `src/lib/readonly-preview/policy.ts` (also sealed in v7).

No missing production configuration was established. Actual property publication, inventory/rates and function permissions could still affect a future normal-mode booking request; they were deliberately not probed here. Installed Next page documentation confirms the asynchronous searchParams contract used by BookPage.

## Local corrections and tests

**No application correction was warranted for the reproduced failure.** Removing the preview guard, editing its immutable snapshot, switching off flags or starting a normal production-connected dev server would bypass the selected security boundary rather than repair a demonstrated booking defect. All existing application/F01/F03 source and proposals remain byte-identical. No SQL proposal or migration was created.

Added only `tests/booking-local-investigation.test.ts`, eight behavioral offline regressions covering the exact URL/intentional denial; actual BookPage-to-BookingFlow prop transfer; invalid dates/counts; actual reducer loading/empty/error/selection; stale selection/hold clearing; mocked availability transport; hold/confirmation failures without automatic retry; and seasonal pricing plus EUR/USD/GBP/ALL formatting. Mock transport intercepts every service request; no endpoint is called on the running server.

| Check | Result |
| --- | --- |
| Focused booking/search/occupancy/allocation/pricing tests | **30/30 PASS** |
| Full canonical unit suite | **176/176 PASS**, zero failures/skips |
| TypeScript / ESLint | **PASS** |
| Controlled production-style Next16.3.4 Webpack build | **PASS**, Node20.19.5, OS deny network*, sterile configuration |
| Build artifact verification | **503 hashes rechecked**, zero mismatch |
| Dependency integrity | **22,428 entries** unchanged canonical/clone before/after |
| Existing source/security preparation | Preserved unchanged; only new test and this report added |
| Real quote/hold/confirm/cancel/notification | **NOT TESTED** |
| Actual desktop/mobile booking layout, clicks, overflow | **NOT TESTED**; existing e2e specs were not run against the restricted preview |

Final evidence: `.local/safe-checks-20261021T125538889051Z/`, completed12:57:06UTC; artifact-manifest SHA-256 **`f99f35dda36b4a668b63d1eeda7e4b38a47fea9d4eddeee71b321c901c739026`**. Private investigation evidence: `.local/booking-failure-investigation-v1/`. The initial validation caught a naming-only lint issue in the new test; the name was corrected and the final complete run passes. Canonical app code and the running snapshot were not edited.

## Remaining backend/reliability limits

The existing roadmap's F12 retry/idempotency acceptance remains open. BookingFlow currently starts hold then confirmation on its final action; a lost response/retry can require backend idempotency semantics. The mock test proves failures reject and the service adds no hidden automatic retry; it **does not prove duplicate prevention, locking, reservation uniqueness or concurrency**. No duplicate reservation was created to demonstrate behavior. This known backend-dependent issue is not the cause of the local403, and its safe correction requires a separately reviewed contract, not an incidental SQL change.

F27's recorded SQL rejection of ALL currency remains an independent blocker when that currency is selected. Passing JS formatting/catalog tests does not fix or validate room/package SQL. Actual rates, seasons, availability, hold expiry, cancellation release, add-on capacity, outbox/delivery and admin visibility remain unverified against the selected live database. Existing F02 helper restrictions were preserved; they were not revoked/reopened or bypassed to test bookings.

## Exact safe testing path

**Safe now:** run the focused offline regression suite or the existing `python3 scripts/borealis-safe-checks.py` from the canonical directory. These use synthetic data/mocked transport and deny networking. They can validate dates, occupancy, allocation, prices, component props/state and error handling without reservations. The current port3000 preview remains suitable only for the allowlisted informational pages.

**Next interactive UI step:** prepare a fixture-only browser/component harness using canonical BookingFlow, not the sealed preview. Before loading any component, block all real network traffic and fulfill every availability/hold/confirmation request with explicitly synthetic responses (or inject fake booking adapters). Supply synthetic page/add-on/occupancy props and no production/provider credentials. Exercise available/empty/error states, selection, guest validation, review and fake confirmation at desktop/mobile widths; assert zero upstream requests. Mocked holds must never reach a Next route backed by Supabase. This is a local test harness, not a new database/project/hosting environment. No such interactive harness was started in this task.

Do **not** simply run unrestricted npm run dev with the existing .env.local, visit /book on Netlify, click Confirm, or whitelist booking/RPC routes in the restricted preview. That would expose write-capable endpoints connected to the existing project. No change of server ownership or shutdown is implied by a test instruction. Any later request to replace/restart the existing process must authorize that explicitly and preserve owned-process checks.

**Separately authorized live acceptance** must name the existing target, synthetic properties/room inventory/guest identities, permitted quote/hold/confirm/expiry/cancellation cases, provider-send suppression and exact cleanup. Review triggers/RPC call graphs before treating even a quote endpoint as harmless. Real SQL corrections, real reservation mutations and notifications are excluded from this task and require their own approval. Do not use customer inventory or assume a transaction rollback undoes email or external effects.

**Decision: PARTIAL booking readiness; confirmed environment limitation, not a reproduced booking application failure.** The supplied request cannot display rooms on this intentionally restricted server. Offline canonical booking checks pass, but full browser/backend booking functionality has not been established. No automatic server restart or production action follows.
