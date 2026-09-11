# Booking workflow audit

## Before this completion

- **Stay:** real Supabase room inventory and server-side nightly pricing.
- **Enhance:** real published Experience and Transfer records were displayed,
  but in one undifferentiated list. Selection stored only product id/type; no
  date, time or participant data was collected. Product capacity and dated
  experience inventory were not checked.
- **Details:** real guest data was collected and stored in `booking_guests`.
- **Review:** created the database hold before showing a minimal review message.
  It did not display the complete package.
- **Persistence:** add-ons did become `booking_items`, but without scheduling,
  item currency or item lifecycle snapshots. Prices were re-read server-side.

## Completed architecture

- The four-step UI retains one reducer-backed checkout state while navigating
  between Stay, Enhance, Details and Review. No guest information is put in a
  URL or local storage.
- Enhance is separated into Experiences and Transportation. It uses only
  published/bookable Supabase products and collects service date, optional
  time, participants/passengers and quantity.
- Review is read-only and precedes database creation. The final confirmation
  click calls `create_booking_package_hold`, which allocates the room and
  validates/inserts every add-on in one PostgreSQL transaction.
- Experience dates must fall inside the stay. Specific-date/recurring slots,
  per-booking capacity and remaining slot capacity are checked under the same
  property transaction lock used by room allocation.
- Transfer dates must match the stay window; scheduled weekdays, pickup window
  and vehicle capacity are enforced. There is no shared transfer-seat ledger in
  the current product model, so capacity is correctly treated as vehicle/request
  capacity rather than invented shared inventory.
- Client totals are previews only. Room, experience and transfer records,
  pricing basis, quantities, currency and final totals are recalculated in the
  database.
- One booking contains one room item plus zero or more experience/transfer
  items. Each item snapshots title, unit price, subtotal, currency, service
  date/time, requested quantity and item status.
- Confirmation is token-based and refresh-safe. It reads a privacy-limited
  package RPC and displays all products and the authoritative price breakdown.
- Admin booking detail displays the same complete package and item lifecycle.

## Operational limitations

- Payment remains the configured Pay at Property/request workflow; no payment
  provider is simulated.
- No email provider is configured, so package confirmation email delivery is
  not claimed.
- Experience schedule rows are supported by the database and checkout engine,
  but the current Experience editor still lacks a detailed multi-slot schedule
  management UI.
- Transfer capacity is per requested vehicle because the current transfer model
  has no shared departure/seat inventory entity.
