# Borealis booking engine audit

2026-10-20 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Audit only; no fixes or deployment.

**Overall: PARTIAL; not certified for real-customer transactions.** Strong inventory/pricing controls are present and relevant unit tests pass. No real hold, reservation, cancellation, payment, admin edit or channel synchronization was performed. There is no observed overselling incident in this audit; concurrency correctness needs isolated database execution.

## Authoritative flow

```mermaid
sequenceDiagram
  participant B as Booking UI
  participant N as Next API
  participant S as Supabase SQL transaction
  participant D as Inventory / bookings / guests / items
  B->>N: POST pricing: dates and category counts
  N->>S: available_room_count + calculate_room_stay_price
  S-->>B: complete-party allocation options via API
  B->>N: POST hold: allocation, guest, add-ons
  N->>S: create_multi_room_booking_package_hold
  S->>D: validate and atomically reserve rooms/add-ons
  S-->>B: hold id/token/reference/expiry/authoritative total
  B->>N: POST confirm: id + token
  N->>S: confirm_booking_hold
  S->>D: held → pending or confirmed; synchronize items/reservations
  N-->>B: reference/status/token
  N->>N: after callback dispatches queued owner email
```

Standalone experience booking uses create_experience_booking_hold then the same confirm endpoint and confirmation page. Transfers are room-package add-ons; a separate vehicle dispatch/fleet system was not found.

## Lifecycle trace

| Stage | UI / entry | Backend / dependencies | Validation and concurrency | Evidence / gaps |
| --- | --- | --- | --- | --- |
| Dates and guests | BookingSearch,DateRangeCalendar,GuestSelector; search-criteria.ts | URL checkIn/checkOut/adults/children/infants; /api/pricing | Real date roundtrip, future dates, end>start, integer counts, adult>=1, total<=24 safety ceiling | Unit tests PASS; no live quote RPC; interval cost cap F13 |
| Age categories | OccupancyAgePolicy, Settings, room form and GuestSelector | site_settings infant/child age labels; room_types occupancy maxima/minimum adults | Per-category counts and room policy validated; no DOB/age proof collected | Count validation PASS in JS; minimum booking-holder-age setting not enforced as identity/attestation F19 |
| Catalog/room selection | contentRepository.getRooms + accommodation-allocation.ts | Published visible room_types, rooms, amenities, media, rates | Allocation constructs complete party, capacities and allowed infant-count semantics | Allocation/occupancy unit PASS; public CMS completeness not certified |
| Availability | /api/pricing → available_room_count | rooms active/published/available; room_reservations; availability_blocks | Half-open stays [check-in,check-out); ignore expired holds; manual/import blocks inclusive dates | Function source traced; exclusion constraint present in catalog; last-room concurrency NOT TESTED |
| Nightly price | /api/pricing → calculate_room_stay_price | rates,seasonal_rate_periods,seasonal_rate_room_types,pricing_rules,room_types | Active rate required; seasonal/weekend overlap errors; min/max stay; arrival/departure closures; extra guest fees; one discount; currency agreement | JS catalog tests PASS; authoritative SQL comparison NOT TESTED |
| Displayed starting rate | services/pricing.ts / core.ts | Same rate catalog subset | Base/season/minimum catalog display, not the full final-price authority | Do not treat starting price or unused calculateStayPrice facade as a guaranteed quote; preserve server final recomputation |
| Multi-room hold | BookingFlow → /api/bookings/hold | create_multi_room_booking_package_hold → create_booking_package_hold → create_booking_hold | Same property, category sum equality, per-room occupancy, price/currency recheck; first hold takes property advisory lock; subsequent rooms FOR UPDATE SKIP LOCKED | Atomic SQL wrapper and catalog guard present; rollback/concurrent allocations NOT TESTED |
| Guest fields | GuestForm + hold API + SQL | booking_guests and bookings | Required names/email/phone at API; SQL guest checks independently; UI presence checks do not replace server validation | Static trace; no guest personal records read or inserted |
| Add-on selection | BookingFlow Enhance; /book builds eligible list | booking_items; create_booking_package_hold validates experiences/transfers | SQL recalculates price and dates; cannot trust submitted price; same currency; per-request capacity | Package SQL scenarios exist, NOT RUN; on-request price and quote copy need operational acceptance |
| Experience schedule/capacity | ExperienceBookingFlow; GET/POST /api/bookings/experience | get_public_experience_slots,create_experience_booking_hold; migration 033 reservation validation | Active/bookable/standalone eligibility, operating dates/times/cutoff/min/max, same property lock and active booking_items totals | Unit schedule/validation only; simultaneous standalone/add-on last slot NOT TESTED; override editor F20 |
| Transfer add-on | TransferCard/detail → /book?transfer=; Enhance | transfer_routes and booking_items | Published/active/bookable, request quantity<=capacity, dates within stay/check-out, scheduled day/time, authoritative per-passenger/fixed price | No aggregate seat/vehicle ledger; suitable only if operational model accepts that limit (F20) |
| Hold expiration | Returned expires_at and subsequent SQL creation/availability logic | expire_booking_holds; hold_expires_at; status triggers | Expired holds excluded from live availability and lazily cancelled on new hold; public direct helper exposure F02 | No cron expiry evidence; lazy cleanup is not automatically broken, but expired-admin precheck mismatch F20 |
| Confirm | /api/bookings/confirm, id+token | confirm_booking_hold (latest migration 038) | Row FOR UPDATE, correct token, held/unexpired, current room occupancy recheck; booking_mode request→pending or instant→confirmed | No money collected by confirm; idempotent recovery missing F12; repeat confirm after committed success returns invalid/expired |
| Confirmation display | /booking/confirmation/[token] | get_booking_confirmation_package(UUID), SECURITY DEFINER read-only | Token-gated limited package; held booking excluded; noindex/nofollow | Source only. Never opened real/token-bearing records. Token possession is intended public capability; lifecycle/privacy/expiry still require isolated tests |
| Admin manual booking | ManualBookingForm → createManualBooking SA | create_admin_booking; shared hold/price functions | Active O/M/S and SQL service/role check; same inventory | Not invoked; anon EXECUTE on overload is not by itself authorization bypass |
| Admin status change | BookingStatusForm → changeBookingStatus SA | Property-scoped bookings update with expected-current-status CAS | Allowed transition map, affected-row check; triggers synchronize room_reservations/item status | No real modification. CAS is positive control; illegal transitions and concurrent status changes require DB tests |
| Cancellation/release | Admin confirmed/pending etc→cancelled | Migration 030 sync trigger releases blocking room/item states | Cancelled/completed rows excluded by overlap predicate; cancellation atomic with triggers | No public cancel endpoint found, no invented customer cancellation feature; actual release NOT TESTED |
| Notes / lists | BookingNoteForm/admin list/detail | booking_guests/items + private notes; property scoping | O/M/S writes; note and list failures need checked row feedback | No private rows queried; list filtering performance F24 |
| Notifications | Trigger migration 031; Next after callback | notifications,notification_deliveries; Resend service | Durable in-app uniqueness; provider delivery occurs after booking commit | Good separation from booking SQL; guest sender absent F08, retry/claim weak F09, no provider sends |
| Channel import/export | ChannelsManager/manual owner sync and secret internal endpoint; /api/calendars/[filename] | external_calendars/events + blocks; export-token read functions | Transactional sync role check; generated 64-hex export filename validation; no private guest detail intended in ICS | No real feed/token export invoked; scheduler/fetch risks F10/F11; freshness not certified |

## Inventory and transaction assessment

The recorded database has `room_reservations_no_overlap`: a GiST exclusion on room_id equality and overlapping daterange(check_in,check_out,'[)') for held,pending,awaiting_payment,confirmed,checked_in states. That is a real database safeguard, not merely frontend logic. It has a check-out>check-in constraint and a unique (booking_id,room_id) constraint. Source also defines token/reference uniqueness indexes; the complete live secondary-index inventory was not collected, so those standalone index identities are not all independently certified here.

`guard_availability_block_reservations` in migration 027 takes the same property advisory transaction lock and rechecks active reservations before writing blocks. This addresses the application precheck race in its authoritative SQL path. Multi-room allocation uses row locks, skips locked candidates and wraps all selected rooms/add-ons in one function transaction. Exceptions roll back that transaction. SQL source and recorded trigger/function/constraint metadata support this design; two actual simultaneous connections were not used.

Bookings carry older status/occupancy fields alongside newer normalized fields. Current updates synchronize status/booking_status and latest occupancy snapshots; existing legacy nullable infant/total fields remain intentionally supported in the database check. Do not tighten constraints or rewrite old bookings without a separate migration/data analysis. Force RLS=false is not itself a booking defect: security-definer functions must instead be assessed by grants, caller authorization, input/property checks and trusted object resolution.

Admin transition map: held→pending/cancelled; pending→awaiting_payment/confirmed/cancelled; awaiting_payment→confirmed/cancelled; confirmed→checked_in/cancelled; checked_in→completed. Completed/cancelled are terminal in the UI map. Refunds, customer cancellation, payment settlement and changing dates/rooms are not equivalent to this status action and were not found as complete tested workflows. Cancellation is not a refund implementation.

## Price and retry limitations

The SQL function is the final price authority, not a client total. It recalculates nightly amounts, constraints and currency on hold creation. Search results can become stale before creation, which should fail/reprice rather than oversell. Rule conflicts intentionally raise errors instead of guessing a rate. The admin permits saving a conflicting seasonal rate with a warning; such a saved conflict can make quotes fail until corrected. Use transactional validation and an explicit activation policy (F04), rather than treating all overlap warnings as harmless.

Amounts/null prices labelled “on request” are converted to zero in parts of the add-on path. The UI must clearly separate an unpriced request from a free confirmed service; the owner must approve intended behavior before accepting such products online. Current pay-at-property messaging is hardcoded in booking review and no provider checkout/webhook/refund flow exists. Deposit/online payment switches cannot be treated as working payments (F19).

Atomic database work does not make HTTP retries idempotent. Both UI flows create a new hold on each confirmation attempt and SQL confirm requires held status. Response loss after a successful commit can look like a failed reservation; notification send response loss is a separate problem (F09/F12). Public anonymous hold functions also need an abuse/work budget that applies to direct database API callers, not only Next routes (F13).

### Confirmed currency support mismatch (F27)

Admin CurrencySelect and isSupportedCurrency explicitly offer ALL — Albanian Lek. The current reconciled room-price SQL rejects target_currency=ALL as though it were a wildcard; the package add-on branch also rejects ALL. Standalone experience SQL does not impose the same restriction. This is a confirmed contract defect, conditional on selecting that legitimate currency; no current production rate values were queried. Preserve mixed-currency rejection while aligning real supported currency behavior in an approved fix.

## Existing tests and what they prove

This audit ran all 125 repository tests with Node 20 and OS network denial. Relevant files: accommodation-allocation, booking-search-criteria, date-range, occupancy-policy, pricing, room-validation, experience-validation, transfer-validation, ical, notification-email and readonly-preview/framework/images tests. They verify pure calculation/validation and mocked/static boundaries. They do not open PostgreSQL transactions or send a real booking.

Eleven SQL scenario files exist under database/tests, including booking_engine_acceptance_scenarios, booking_management, multi_room_booking, room_occupancy_policy, standalone_experience_booking, unified_rooms_inventory, owner_notification and ical_channel_sync scenarios. They were read as intended coverage and NOT RUN on production. Presence of a scenario file is not a PASS. Playwright suites are mainly public/navigation/entry/hero checks, not full authenticated booking/admin integration certification; their default starts unrestricted dev at 3100 and was not run with production configuration.

## Required safe acceptance plan

Run only on a separately authorized isolated backend with synthetic guests, fake mail and fake calendars. Start from a reconciled schema, not blindly replayed production history.

| Test group | Required acceptance |
| --- | --- |
| Dates/categories | Invalid/leap/past dates, adult-less party, category changes, infant exclusion semantics and configured limits rejected/accepted consistently at UI/API/direct SQL |
| Pricing | Base, weekend, season boundaries, overlap, discount, extra guest, min/max stay, arrival/departure closure, mixed currencies, on-request/null price, rounding and SQL/UI totals agree |
| Last room | Two concurrent requests for the final unit yield at most one blocking reservation; aborted transaction leaves no orphan holds/items/guest row |
| Multi-room | Repeated room type, insufficient second room, cross-property id and allocation sum mismatch roll back the entire package |
| Blocks/import race | Booking vs manual block and import vs booking share lock semantics; adjacency and inclusive block endpoints behave deliberately |
| Experience last slot | Standalone/add-on concurrent participants share capacity and cutoff/slot/day overrides; expiration/cancellation release it |
| Transfer model | Per-request and, if required, aggregate inventory semantics explicitly tested; no unsupported fleet guarantee |
| Expiry/confirm | Confirm before/at/after expiry, double confirm, response loss and retry, stale party/capacity change, wrong token and no token all behave safely |
| Admin roles | O/M/S permitted operations, editor restrictions, disabled user, cross-property user and direct RPC/table bypass attempts verified with synthetic identities |
| Cancellation | Every allowed transition updates reservation and item status exactly once; terminal/illegal transitions fail; simultaneous status edits cannot silently overwrite |
| Notifications | In-app event and owner/guest messages tested separately; retries/concurrent workers and provider failures do not alter committed booking outcome |
| Contact/calendar | Spam/body budgets, honeypot, malformed feeds, removed events, timezone/all-day/end-exclusive behavior, duplicates and stale sync use fixtures only |
| Recovery | Backup restore, known migration baseline, frontend rollback compatibility and no real-provider side effects rehearsed |

Acceptance evidence must record schema/runtime/source identity, concurrency outcomes and sanitized IDs only. Do not copy real production guest data into tests. See F02,F04,F08–F14,F19–F20 in [roadmap](BOREALIS-REMEDIATION-ROADMAP.md). Until those gates pass, real-customer booking readiness remains NOT CERTIFIED, regardless of the seven informational pages passing HTTP checks.
