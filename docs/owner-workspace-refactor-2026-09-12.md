# Borealis Owner Workspace audit — 12 September 2026

## Outcome

The Admin information architecture now starts with daily owner tasks. The existing booking, pricing, availability, occupancy, content, media, authentication and database layers remain in place; this refactor changes their presentation and navigation, not their rules.

## Navigation

The previous sidebar exposed 17 destinations: Dashboard, Bookings, Availability, Rates & rules, Channel calendars, Contact enquiries, Rooms, Amenities, Experiences, Transfers, Website content, Explore Koman, Media, SEO, Languages, Notifications and Settings.

The primary navigation now has eight destinations:

1. Dashboard
2. Bookings
3. Calendar
4. Rooms & Rates
5. Experiences & Transfers
6. Website
7. Media
8. Settings

Secondary tabs keep the existing routes accessible inside the relevant workspace. No feature required a ninth primary destination.

## Canonical source-of-truth map

| Owner task / concept | Where owner does it | Source of truth | Public/system effect |
| --- | --- | --- | --- |
| Review or create a booking | Bookings | `bookings`, guests and booking items | Calendar, notifications, availability and confirmations |
| Change room price | Rooms & Rates → Price or Rates | Rates and pricing rules | Room cards and server-side booking price |
| Block dates | Calendar | Availability blocks | Removes matching inventory from booking search |
| Edit room details | Rooms & Rates → Rooms | Room records and linked amenities/media | Rooms pages, featured room cards and booking choices |
| Change room occupancy | Rooms & Rates → Rooms → Guests & beds | Room occupancy policy | Search allocation and server booking validation |
| Edit an experience | Experiences & Transfers → Experiences | Experience record | Experience pages and booking add-ons/standalone flow |
| Edit a transfer | Experiences & Transfers → Transfers | Transfer record | Transfer pages and booking add-ons |
| Change homepage content/image | Website → Homepage | Structured website content and Media Library | Public homepage after publish |
| Change phone/address/map | Settings → Property | Property settings | Contact, footer, map and other property consumers |
| Change booking/age rules | Settings → Booking policies | Property and booking settings | Public booking validation and owner operations |
| Upload/reuse photos | Media | Shared media assets | Selectable by rooms, experiences, transfers and website content |
| Change languages | Settings → Languages | Language and translation records | Enabled public translations |
| Review notifications | Settings → Notifications | Notification records/settings | Owner alert workflow |

## Duplication audit

- Property contact and map details remain centralized in Settings and are consumed by public Contact/footer/map code.
- Room names, prices, occupancy and cover media remain canonical in Rooms/Rates; Homepage only selects featured records.
- Experience and transfer product data remain in their respective repositories; Website controls page presentation only.
- Media remains one shared upload and picker architecture.
- Languages, notifications, SEO and channel integrations remain single modules, surfaced as contextual tabs rather than duplicate sidebar entries.
- No database fields or applied migrations were removed. Hidden slugs, identifiers and ordering fields remain available to backend validation and persistence.

## Owner-facing changes

- Dashboard now shows today’s arrivals, departures and in-house guests; the next five bookings; actionable warnings; and five quick actions. Content/media counters were removed.
- Calendar wording now uses room/unit language, provides a direct Block dates target, and has calm empty/error states.
- Room rows show image, name, price, capacity, units and publication state with Edit, Price and Availability actions.
- Base price can be changed inline, with seasonal pricing linked to the full Rates view.
- Room editing follows Basic information, Guests & beds, Amenities, Price, Availability and collapsed Advanced settings. Slug/order fields are automatic and hidden.
- Experiences and Transfers share one primary module with contextual tabs. Their lists no longer expose slugs; the Experience editor moves search fields into Advanced settings.
- Website presents public pages in public-site order and moves shared footer/navigation configuration under “More website settings.”
- Homepage CTA destinations use safe predefined choices. Hero booking search and the essential hero/final CTA sections cannot be accidentally hidden. Manual section-order fields are hidden while their stored order is preserved.
- Settings groups Property, Booking policies, payment and notification preferences; uncommon location, booking-window and payment controls are progressively disclosed.
- High-frequency mutations use a shared owner-safe error translator while technical errors are logged server-side.
- Context tabs scroll horizontally on narrow screens, forms/cards stack, touch targets remain at least 40–48px, and the inline Price panel expands in-flow on mobile.

## Guardrails and shared components

- Existing archive/restore and confirmation flows remain intact.
- Publishing still passes through existing validation; booking and payment statuses remain separate.
- `AdminWorkspaceNav` supplies contextual module navigation.
- `QuickRoomRateForm` supplies the common base-price action.
- `ownerSafeError` keeps PostgreSQL/Supabase implementation detail out of common owner actions.
- No database migration was needed.

## Validation

- TypeScript: passed (`npx tsc --noEmit`).
- ESLint: passed (`npm run lint`).
- Unit/integration tests: 91 passed (`npm test`). These cover allocation, booking criteria, occupancy, prices, room/experience/transfer validation, media optimization, notifications, maps, content ownership and Admin source-of-truth behavior.
- Production build: passed (`npm run build`), including all Admin and public routes.
- No Admin-specific Playwright suite exists in the repository. Existing Playwright specs cover public behavior only and were not treated as Admin coverage.

## Remaining recommendations

1. Add authenticated Admin Playwright journeys for price change, blocking dates, room draft/publish, homepage preview/publish and Settings propagation.
2. Add a range-selection interaction to Calendar for direct block/unblock; the current operational form is retained and linked prominently.
3. Continue applying `ownerSafeError` to lower-frequency legacy actions and replace technical setup messages in legacy-only fallback screens.
4. Usability-test the workspace with the owner on a 360–390px phone before the next feature expansion.
