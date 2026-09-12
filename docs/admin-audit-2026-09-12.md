# Borealis Admin audit — 2026-09-12

This inventory records the owner-facing source of truth for every Admin route. Compatibility routes are retained as redirects so saved bookmarks do not break. No database data or schema was deleted during this audit.

| Admin route | Owner purpose | Source of truth | Main actions | Status |
| --- | --- | --- | --- | --- |
| `/admin/dashboard` | Daily operational overview | bookings, room units, availability blocks, booking items, content pages, media | open operational records and quick actions | FIXED |
| `/admin/bookings` | Search and filter all bookings | `bookings`, `booking_guests`, `booking_items` | filter, open, add manual booking | WORKING |
| `/admin/bookings/[id]` | Review a complete booking package | booking plus guest and item records | lifecycle status, internal note | FIXED |
| `/admin/bookings/new` | Create phone, walk-in, or WhatsApp room booking | `create_admin_booking` RPC | validate availability, price, and create | WORKING |
| `/admin/availability` | Decide when inventory can be sold | `rooms`, `room_types`, `availability_blocks`, bookings | block or reopen dates | WORKING |
| `/admin/rates` | Decide what rooms cost | `rates`, seasonal periods, pricing rules | base rates, seasons, stay rules | WORKING |
| `/admin/channels` | Manage external calendar connections | external calendars/events and room inventory | connect, enable, sync | WORKING |
| `/admin/channels/booking-com` | Booking.com calendar guidance | same channel calendar records | configure Booking.com calendar | WORKING |
| `/admin/inquiries` | Process public contact messages | `contact_inquiries` | mark new/read/replied/archive | WORKING |
| `/admin/rooms` | Manage accommodation products and their inventory | `room_types`, `rooms`, rates, amenities, media, SEO | search, edit, duplicate, archive/restore | WORKING |
| `/admin/rooms/new` | Create a room product | same Rooms source | save draft or publish | WORKING |
| `/admin/rooms/[id]` | Edit room content, occupancy, inventory, amenities and photos | same Rooms source | save, inventory sync, media selection | WORKING |
| `/admin/amenities` | Maintain the reusable room amenity catalogue | amenities and room links | add, edit, reorder, archive/restore | WORKING |
| `/admin/experiences` | Manage experience products | experiences, media links, SEO | search, edit, duplicate, unpublish/archive | WORKING |
| `/admin/experiences/new`, `/admin/experiences/[id]` | Create or edit an experience | same Experiences source | schedule, capacity, pricing, media, publication | WORKING |
| `/admin/transfers` | Manage transfer products | transfer routes, media links, SEO | search, edit, duplicate, unpublish/archive | WORKING |
| `/admin/transfers/new`, `/admin/transfers/[id]` | Create or edit a transfer | same Transfers source | availability, pricing, media, publication | WORKING |
| `/admin/content` | Manage editorial public-site content | CMS documents and homepage CMS | open each protected public section | CONSOLIDATED |
| `/admin/content/homepage` | Edit homepage sections | homepage sections/drafts, links and reviews | draft, preview, publish | WORKING |
| `/admin/content/{rooms,experiences,transfers,explore-koman,gallery,about,book,global,footer,navigation}` | Edit landing/static copy and imagery | CMS documents, navigation, central Media Library | draft/publish and preview | WORKING |
| `/admin/content/contact` | Edit Contact page copy and CTAs | contact CMS document; property contacts come from Settings | draft/publish copy | CONSOLIDATED |
| `/admin/explore-koman` | Manage editorial guide articles | tourism articles/categories, related products, media, SEO | create/edit/archive and categories | WORKING |
| `/admin/media` | Upload and reuse public images | `media_assets` and entity link tables | multi-upload, optimize, metadata, archive/restore | WORKING |
| `/admin/seo` | Manage global and landing-page SEO; audit detail SEO | `site_settings`, `page_seo`, `seo_metadata` | save global/page SEO, follow detail edit links | CONSOLIDATED |
| `/admin/languages` | Manage enabled/default languages and translations | `languages`, `translations` | add/edit/reorder languages and publish translations | CONSOLIDATED |
| `/admin/notifications` | Read the private operational notification inbox | `notifications` and delivery state | open booking, mark read/all read | WORKING |
| `/admin/settings` | Manage property, booking, payment and notification defaults | `properties`, `site_settings` | save global property and operational configuration | CONSOLIDATED |
| `/admin/login` | Authenticate an administrator | Supabase Auth and `admin_profiles` | sign in | WORKING |

## Compatibility routes

- `/admin`, `/admin/pages`, `/admin/room-types`, `/admin/room-types/new`, and `/admin/rate-rules` redirect to their current canonical locations.
- Preview entry/exit routes remain authenticated support routes rather than sidebar destinations.

## Source-of-truth decisions

- Property contact details, social links, address, map, timezone, and stay defaults: **Settings**.
- Room product, occupancy policy, unit inventory, and room media: **Rooms**.
- Sellable dates: **Availability**. Prices and stay restrictions: **Rates & rules**.
- Product content: **Rooms**, **Experiences**, and **Transfers**. Website Content owns landing/static editorial copy only.
- Global and landing-page SEO: **SEO**. Product detail SEO stays with its product editor and is audited from SEO.
- Enabled/default languages and translations: **Languages**.
- Notification delivery preferences: **Settings**. Notification activity: **Notifications**.
- Reusable images: **Media**, selected from product/content editors.

## Findings and changes

- Fixed dashboard records that used legacy status/content fields, generated fake-looking references, counted experience availability slots as bookings, hardcoded the euro symbol, and linked recent bookings to the list instead of their detail page.
- Removed duplicate contact/social editors from Website Content → Contact. Existing legacy JSON keys are preserved when the document is saved and remain an emergency read fallback; no stored data was deleted.
- Connected the Settings Facebook URL to the public Contact page and both footer variants.
- Removed duplicated default-language and default-SEO-image controls from Settings. Languages and SEO are now the only owner-facing editors for those values. The unused `default_contact_cta` control was also removed; its stored setting is untouched.
- Added explicit pending/success/error feedback to booking lifecycle and internal-note mutations.
- Regrouped Experiences and Transfers under Activities, and Languages under Website.
- Kept room-gallery browser mutations behind the existing role-aware RLS and same-property foreign keys, and added explicit property and room-category filters to every update. Failed reorders now restore the previous UI order.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm test`: 90 passed, 0 failed.
- `npm run build`: passed; all 54 static-generation steps completed.
- `git diff --check`: passed (line-ending conversion notices only).

## Remaining review items

- Live Supabase/RLS workflow verification requires valid owner, manager, editor, and staff test accounts plus a non-production test property.
- Channel import/export needs a real third-party iCal URL for end-to-end verification.
- Payment controls describe configuration only; online payment remains deliberately disabled until a server-side provider secret exists.
- Some legacy compressed one-line components are maintainable but should be formatted separately to avoid noisy unrelated diffs.
