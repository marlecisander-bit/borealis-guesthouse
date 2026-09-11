# Borealis booking engine audit

Audit date: 5 September 2026

## Status before completion work

| Area | Previous status | Evidence |
| --- | --- | --- |
| Public search | Functional but split pricing logic | `/api/pricing` queried real published rooms and `available_room_count`, then priced separately in TypeScript. |
| Availability | Functional | Physical units, reservations, manual blocks and mirrored iCal events fed the same database count. |
| Inventory | Functional | `room_types.inventory_count` was materialized into lockable `rooms` units. |
| Holds | Functional | `create_booking_hold` allocated a unit for 15 minutes and expired abandoned holds. |
| Overbooking protection | Functional | Row locks, property advisory locks and a GiST exclusion constraint protected half-open room stays. |
| Final price security | Functional but incomplete | The database recalculated base and seasonal prices, but search used a separate TypeScript calculation and several configured rules were not applied. |
| Booking persistence | Functional | Booking, item, guest and room-reservation rows were created in Supabase. |
| Confirmation | Partial | Confirmation existed only in React state and was lost on refresh. |
| Admin booking list/detail | Partial | Basic list, search and lifecycle changes existed; source, payment and price breakdown were missing. |
| Manual Admin booking | Not implemented | No owner workflow existed. |
| Payments | Data model only | Pay-at-property/unpaid state existed; no real online provider was configured. |
| Email | Settings only | No delivery provider or server credential was configured. |
| Mock booking data | Not used in production | No localStorage or in-memory booking source was found. |

## Resulting architecture

- `calculate_room_stay_price` is the authoritative database price calculation used by search, direct holds and manual Admin bookings.
- `available_room_count`, `room_reservations`, `availability_blocks`, and imported iCal mirrors remain the central availability engine.
- `create_booking_hold` validates the published room, capacity, configured booking window, guest details, add-ons, currency, live price and final inventory inside one database transaction.
- `room_reservations_no_overlap` enforces `[check_in, check_out)` semantics per physical unit. Property advisory locks coordinate bookings with manual/iCal blocks.
- `booking_reference_counters` generates concurrency-safe references such as `BRL-2026-00001`.
- Public confirmation is read through an unguessable booking token and returns a deliberately limited data shape.
- Manual Admin creation calls `create_admin_booking`, which delegates to the same hold, pricing and inventory transaction before confirming the reservation with `source=admin`.
- Cancellation preserves the booking and changes its reservation status, immediately releasing inventory.

## External integrations

- Online payment is intentionally not simulated. Current bookings use `payment_status=pending` and `payment_method=pay_at_property`.
- Email is intentionally not simulated. A real provider and server-only credentials must be configured before guest/admin delivery can be enabled.
- iCal synchronization remains eventual rather than real-time; remote channel races cannot be eliminated without a channel API.

## Validation

- `database/tests/booking_engine_acceptance_scenarios.sql` covers authoritative price, capacity, reference format, persistence, overlap rejection, checkout-day arrival, cancellation, manual creation and token confirmation.
- PostgreSQL exclusion constraints and transaction-level advisory locks provide concurrency protection; the database test makes a second final-inventory attempt and requires it to fail.
- Application TypeScript, ESLint, unit tests and the Next.js production build pass.
