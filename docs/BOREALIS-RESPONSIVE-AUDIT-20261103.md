# Responsive audit — 3 November 2026

Local fixes only. No commit, push, deployment, migration, production form submission, booking, receipt, email or settings change. The earlier uncommitted admin redesign is preserved. The pre-audit candidate hashes and source snapshot are in `.local/responsive-audit-20261103/`.

## Revision and coverage

Repository: `marlecisander-bit/borealis-guesthouse`; local HEAD and remote main were `12152981279ac4ac1c259c6c83d73bf687c7b771`. The current public site's ten referenced asset paths matched immutable deploy `6ae9fb6eeed19af8248fd94e`, previously verified against that commit. This is an asset-set comparison, not a fresh Netlify management-UI commit inspection.

The [complete route/viewport matrix](responsive-audit-20261103/coverage.csv) inventories **59 page patterns** and every discovered concrete public case. The [synthetic scenario matrix](responsive-audit-20261103/scenarios.csv) separately records actual source-component rendering. Codes: **H** = read-only hosted browser check; **L** = local application with current public content; **F** = actual presentation source with synthetic dependencies; **E** = representative editor/navigation component; **B** = authenticated UI blocked; **U** = unverified. F/E never establish authenticated route acceptance.

All eight requested viewports were rendered in headless installed Chrome: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900 and 1920×1080. Local checks additionally cover 639/640, 767/769, 1023, 429/431, 1279/1281, 1535/1536 and 1599/1600 widths; 844×390 landscape; and 720×450 reflow. The latter simulates the CSS viewport of a 1440×900 desktop at 200%; actual browser-chrome 200% zoom was not available.

- **Hosted:** 17 concrete public routes × eight sizes. Homepage, lists, all three published room details, both published experience details and their booking routes, room booking, gallery, Explore Koman, transfers, about/contact and admin sign-in. No overflow, page/console errors or broken eager images in recorded cases.
- **Local application:** the same 17 routes × 23 profiles. Diagnostic scans explicitly remove root clipping; they do not rely on hidden overflow. Separate full-page scrolling loaded visible/lazy media on 16 public routes at all eight main sizes (128 media checks).
- **Isolated source fixtures:** dashboard; rooms; rates and pricing forms/calendar; amenities; availability; media; languages; SEO; bookings populated/empty; booking detail/manual entry; inquiries; notifications; channels; homepage CMS; representative about CMS; new article editor; transfer/article templates; gallery lightbox; confirmation; rates failure; all three explicit loading components and the admin error boundary (with synthetic retry). Long names, translated text, long unbroken references, multiple rows and large ALL amounts are synthetic.
- **Workflow fixtures, ten profiles each:** room search → rooms/add-ons → guest validation → review → synthetic confirmation/cancellation; rental hourly/daily/date/time/quantity selection and room add-ons; owner rental/experience/room/transfer editors, media cover/reorder, validation, draft/publish adapters, settings, navigation/More actions and dirty-state retention. All outbound requests are blocked. These exercise client flows, not live server authorization or payments.
- **Local read-only controls:** calendar and guest-selector bounds, Tab containment, Escape/focus return; room gallery; long translated header text/spacer alignment. Eight primary profiles, landscape and a 390×420 reduced-height proxy. Synthetic gallery lightbox also checks next-image, Escape and focus return.

## Defects fixed

| Finding | Local fix / source |
| --- | --- |
| Intrinsic widths in language/filter controls and long booking content escaped their containers; root clipping concealed some overflow | Shared `min-width:0`, bounded controls and long-text wrapping in `src/app/globals.css`; removed root `overflow-x:clip` and admin-main `overflow-x-hidden` in `src/app/admin/layout.tsx` |
| Homepage featured-choice grid could expand to 773px on a phone | `src/components/admin/HomepageCmsForm.tsx`: shrinkable grid item, wrapped full label, compact non-shrinking order field |
| Long confirmation references escaped the card; line-item currency could become a vertical column | Shared wrapping plus responsive stacked line items/wrapping totals in `src/app/booking/confirmation/[token]/page.tsx` |
| Wide tables/calendars were hard to reach by keyboard; calendar names depended on truncation and rooms after the first three were omitted | Named focusable scroll regions, header scopes/names and calendar table roles in admin bookings/SEO/availability/rooms; all room prices and wrapped names in admin rates |
| Custom dialogs lacked consistent focus trapping/return and visual-viewport bounds | `src/hooks/useDialogFocus.ts`, applied to DateRangeCalendar, GuestSelector, RoomGallery, GalleryExplorer, MediaLibrary and MediaPicker; calendar/guest portals avoid ancestor clipping; picker/preview scrolling and safe-area CSS |
| Long header CTA/language text needed more room and fixed spacer height could disagree with the header | `src/components/public/Header.tsx`: dynamic measured spacer, shrinkable/wrapping groups; LanguageSwitcher bounded display; shared CTA text wraps |
| Admin nav alignment conflicted with generic button alignment; unknown-count pagination misreported count/pages | `src/app/control-alignment.css`, AdminSidebar and `src/components/admin/Pagination.tsx` |
| Language creation/translation controls, inquiry status and booking notes lacked accessible names | Explicit names in admin languages/inquiries and `src/components/admin/BookingNoteForm.tsx`; fixture name inventory verifies visible text controls |
| Some booking hints and keyboard focus were too faint/removed | BookingFlow hint contrast and shared visible focus styles; values and calculations unchanged |
| Notification HTML overflowed on long reference/address/package text | Viewport metadata, bounded fixed-layout presentation tables and wrapping in `src/lib/notifications/email-template.ts`; rendered locally, no email sent |

All three source table implementations (bookings, SEO and availability) were rendered with synthetic records. Native tables retain column headers; the availability grid has table/row/header/cell roles. Intentional wide regions retain every field/action and support arrow-key scrolling. Rates retain all four synthetic room types rather than hiding additional rates. No pricing, occupancy, inventory, payment or permission logic was changed by the responsive fixes.

## Representative screenshots

Original pixels are retained locally; yellow banners identify isolated fixtures. Before images use the preserved pre-audit source, including the earlier admin redesign. After images use the current source. Both receive the same fixture data and fonts.

| Case | Before | After |
| --- | --- | --- |
| Languages at 768px: controls escaping page | [Before](../.local/responsive-audit-20261103/before/admin-languages-768x1024.png) | [After](../.local/responsive-audit-20261103/after/admin-languages-768x1024.png) |
| Bookings at 1280px: long populated rows | [Before](../.local/responsive-audit-20261103/before/admin-bookings-1280x800.png) | [After](../.local/responsive-audit-20261103/after/admin-bookings-1280x800.png) |
| Confirmation at 360px: long reference and amounts | [Before](../.local/responsive-audit-20261103/before/admin-confirmation-360x800.png) | [After](../.local/responsive-audit-20261103/after/admin-confirmation-360x800.png) |
| Email at 360px: long reference/package | [Before](../.local/responsive-audit-20261103/before/email-360x800.png) | [After](../.local/responsive-audit-20261103/after/email-360x800.png) |

## Verification and limits

`npm test`: **210/210 pass**. `npm run lint`, `npx tsc --noEmit`, normal `npm run build` and `git diff --check` pass. Final public scans: **136 hosted + 391 local** cells, no page overflow/runtime/console errors. Source fixtures: **621 cells** across 27 scenarios and 23 profiles; email HTML: **23** profiles; dialog/header checks: **10** profiles; room, rental and admin workflow suites: **10** profiles each. Media: **128** checks, no failed visible images. Screenshot inspection included languages before/after, corrected phone confirmation, phone email and translated phone header. The complete matrices retain unverified states rather than promoting these sampled checks to a whole-application pass.

Automated evidence and raw screenshots: `.local/responsive-audit-20261103/{before,after,hosted}/`. Reproducible browser scripts are under `tools/responsive-audit/`; fixtures require `BOREALIS_BOOKING_FIXTURE=1` and retain the existing network/credential/environment guards. Existing admin, rental and room workflow scripts also cover the eight primary profiles, landscape and reduced reflow viewport. Regression assertions check geometry, keyboard scrolling, header semantics, focus and workflows rather than pixel snapshots.

The native browser-access host failed to start. Consequently **all 43 protected admin route patterns remain unverified through a normal signed-in user session**. Anonymous GETs redirected to sign-in for all 43; this verifies only the gate. No session/token was extracted or service-role access used. Generic content fields, editor components and selected server-page presentations were rendered synthetically; every actual CMS field combination, persisted record, role, filter/pagination navigation and session-dependent header/account/notification dropdown was not accepted. Routes without a rendered representative are explicitly U/B in the matrix, including content/navigation and Booking.com-specific configuration.

There were no published transfer-detail or article-detail records discovered; their actual templates were checked with synthetic repositories. The published gallery had no selectable images; its populated lightbox was checked synthetically. Successful confirmation uses synthetic data; no real token was read. There is no separate public reservation-management route in the source: confirmation and admin booking detail are the existing surfaces. “Journey” links to the existing experiences/transfers model. Dinner uses the existing experience editor/model.

Actual OS keyboards, native date/time popups, physical safe areas/mobile browser chrome, email-client engines and browser 200% UI zoom remain unverified. The reduced-height and reflow proxies are useful checks, not hardware acceptance. All three explicit loading components and the admin error boundary were rendered in isolation, including the error retry adapter. Fixture booking failures/empty states, validation and rates failure were exercised; actual streamed transitions and every data-dependent empty/error variant were not forced. No claim of comprehensive WCAG certification or live authenticated workflow acceptance is made. These gaps require a working authorized browser connection or device check before whole-application acceptance.

The first local scan overlapped a rebuild and produced stale chunk failures; it was discarded and repeated on a stable build. Final resource logs retain `net::ERR_ABORTED` for navigation-cancelled Next.js RSC prefetch requests; they are separated from runtime/console errors and broken images. No essential production content was hidden to obtain a pass.
