# Admin workspace redesign — 3 November 2026

Implemented locally on top of published revision `1215298`. No commit, push, production content write, schema migration or deployment was performed for this redesign. Existing booking tables, guards, permissions, history and public URLs are retained.

## Editors and media

Equipment rental and participant-based experience controls are shown according to service type. Established rentals cannot switch back to an experience in the UI; the database conversion guard remains authoritative. Irrelevant experience fields remain mounted and submitted with their existing values, rather than being cleared. Rental configuration and its equipment identifiers, maintenance, occupancy, daylight, payment and eligibility validation are unchanged.

Rental sections are Details, Pricing, Availability, Equipment and Guest rules, with slug/search text in Advanced. Experience sections use Participants instead of Equipment. Transfer routes retain their separate model and show route, pricing, passenger/schedule and guest-instruction controls. Room editors also use the shared workspace. Fields remain mounted across tabs, with keyboard tab navigation, sticky Preview/Save draft/Publish actions and unsaved-change warnings. Publication status is returned by service save actions after success. An explicit hidden publication intent ensures the pending button state cannot omit draft/publish intent from submitted data.

A shared product photo picker provides thumbnails, search, existing-library selection and the existing upload component/endpoint. Selected photos support cover selection, removal without deleting the asset, drag ordering and keyboard-accessible earlier/later controls. Gallery order is now persisted independently from cover choice. Existing room photo workflows remain available, with a move-down alternative added to their existing drag/move-up controls.

The publication checklist calls the same validation functions as the server actions using the current form values. Required issues link to the relevant editor tab/control; optional recommendations are separate. It does not promise that passing publication checks enables bookings: rental channel, daily-hours, occupancy, equipment verification and policy safeguards still apply.

## Navigation, lists, Website and Settings

The sidebar has full-width Today, Bookings, Calendar, Rooms, Activities & services and Website destinations. Settings and View website are anchored below. Existing routes work; `/admin/services` provides a combined overview, with transfer access still restricted to the existing owner role. One contextual subsection level replaces the long website page-navigation row. Website contains Pages, Photos, Languages and Search appearance. Existing translation links are contextual language controls rather than floating buttons.

Service lists distinguish publication from booking availability and equipment type, show charging bases and thumbnails, and retain explicit Edit plus More actions. Display order is edited on the list. Disabling bookings only turns off channels; it does not unpublish/archive the service, alter equipment, or change existing bookings. New list mutations retain the existing owner/manager/editor or owner-only role checks and explicit property scoping.

Settings separates Property details, Booking policies, Payments & fees, Notifications and Integrations. Existing stay cancellation/payment defaults remain supported. Rentals keep explicit per-service payment, cancellation and beach-entry values: this schema has no shared rental beach-policy inheritance. No inheritance checkbox, new payment capability or automatic override was introduced. Activity/transfer calendar extensions and new dashboard metrics remain future work; existing operational dashboard content is unchanged.

## Verification

- All 210 Node tests pass, including actual SQL rental safeguards and new action/repository tests for tenant-scoped booking disablement, unchanged rental configuration/history boundaries and persisted photo order.
- ESLint, TypeScript and the Next.js production build pass.
- Isolated admin browser fixtures exercise the real editor components and validation with synthetic save adapters at 390, 768 and 1440 pixels: draft/publish intent, failed-publication value preservation, hidden experience-value retention, tab state, photo selection/upload callback/cover/order/removal, unsaved-link confirmation, room/transfer/settings editors, keyboard tabs, mobile navigation, Website sections and list clipping. No database, login session, provider or outbound network is available to these fixtures.
- Existing rental standalone/room-add-on and room booking browser fixtures pass. Their SQL/transport data remains synthetic; these are not live booking confirmations.
- Representative screenshots were inspected and a narrow-column Edit-action wrapping issue was corrected.

The upload integration reuses the production upload flow, but the new isolated picker test uses a synthetic upload callback rather than uploading an asset to production. Authenticated live draft saving/publishing, real upload and hosted acceptance remain release checks. This task did not publish the redesign or enable rentals/online payments.

Private logs and screenshots are in `.local/admin-redesign-20261103/` and `.local/admin-fixture-v1/`. Reproduce with:

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
BOREALIS_BOOKING_FIXTURE=1 node tools/admin-fixture/browser-tests.mjs
BOREALIS_BOOKING_FIXTURE=1 node tools/rental-fixture/browser-tests.mjs
BOREALIS_BOOKING_FIXTURE=1 node tools/booking-fixture/browser-tests.mjs
```

Fixture builds reject production/hosting and credential-bearing environments. Browser scripts use the installed macOS Chrome executable. They do not start the application or contact Supabase.
