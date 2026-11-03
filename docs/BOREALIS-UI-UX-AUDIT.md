# Borealis UI/UX audit

2026-10-20 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Audit only; no fixes or deployment.

**Overall: PARTIAL.** The owner previously accepted the restricted v4 appearance: “Looks OK — images missing due to preview restrictions.” That is overall manual feedback, not measured acceptance of all pages at desktop/mobile widths. The newer v7 photo-enabled preview has successful HTTP/image evidence but no recorded new owner visual confirmation. This audit did not use the normal authenticated Chrome profile, install another extension, run browser automation or claim screenshots it did not capture.

## Evidence used

Current page/component/CSS source, existing unit/static UX tests, earlier admin/mobile audits and owner screenshot/feedback. Fresh audit local HTTP verified seven pages, titles/main markup and preview headers. Both local font responses 200 matched the sealed Manrope 164700-byte and Cormorant 1195560-byte files. The family variables and existing normal styles/weights are retained. No external font download is needed. Delivery bytes are verified; computed font rendering at each breakpoint is NOT independently measured.

The supplied earlier desktop screenshot shows the green hero with missing photograph, logo/navigation, large serif heading and booking search. It documents that older restricted state only. v7 now admits nine exact public photo destinations and uses direct image loading in preview. Earlier v7 checks fetched those exact destinations successfully and confirmed HTML/CSP references. Do not report all photographs fixed visually or a production media fault from the older screenshot.

Historical `docs/admin-mobile-ux-audit-2026-09-12.md` describes entry/login/unauthenticated breakpoint checks. It is not current authenticated editor/save/calendar acceptance. `tests/e2e` defines desktop/tablet/mobile/landscape projects but was not run here: its default starts unrestricted dev and includes routes outside the seven-page preview contract.

## Public page review

| Page/template | Source/content/buttons/states | Desktop/mobile/accessibility assessment | Result |
| --- | --- | --- | --- |
| Homepage | Homepage sections/hero/featured cards/search/footer from CMS with fallback; booking CTA→/book | Responsive hero/mobile asset/focal settings, large type, fixed header; actual v7 photo crop/contrast not inspected | HTTP PASS, overall prior owner acceptance only |
| About | getAbout document story/location/philosophy, CTA; PageShell | Responsive sections and alt strings; direct URL photos/long copy need breakpoint checks | HTTP PASS; detailed visual NOT TESTED |
| Rooms list | Published cards, amenities, from-price, View room→/rooms/slug and availability→/book?room=slug; Suspense loading status | Responsive alternating layout, min-height buttons, mobile search; no explicit empty-list message when reader returns[] | HTTP PASS; error/empty provenance PARTIAL F18 |
| Room detail | Gallery, facts/capacity, related rooms, booking bar, metadata | Keyboard gallery lacks complete focus lifecycle F21; sticky bar/footer overlap needs testing | Static only; runtime blocked by preview allowlist |
| Experiences list | Cards→detail, availability/CTA; CMS landing text | Responsive grid/aspect ratios; empty array leaves no dedicated explanation; translated descriptions mismatch F05 | HTTP PASS; visual/empty state PARTIAL |
| Experience detail | Media, included/notes/requirements, standalone/add-to-stay eligibility | Useful facts and CTA distinctions; excluded_items editor field not displayed by inspected public model; gallery keyboard review needed | Static only; detailed runtime NOT TESTED |
| Transfers list/detail | Route cards/details, schedule facts, CTA→book/contact | Responsive list/process grid; no aggregate availability/fleet promise should be implied; owner-only draft preview on listing differs from broader editor role | List HTTP PASS; detail/preview role UX NOT TESTED |
| Explore Koman list/article | Published cards/structured blocks, related room/experience/transfer links | Editorial grid/body/images; block media and long translations need review; no dedicated empty-list explanation | List HTTP PASS; article runtime NOT TESTED |
| Gallery | Published gallery_items/media, category filters and lightbox | Column-based photos/touch/arrow controls exist; focus containment/restoration incomplete; membership control missing F06 | HTTP PASS; photo/category/lightbox acceptance NOT TESTED |
| Contact | Contact fields/maps, validation/honeypot, success/error/disabled pending state | Labels, aria-invalid/describedby and alert/status feedback exist; page/map/submission not exercised | NOT TESTED runtime; no forms submitted |
| Room booking | Four-stage dates/options/add-ons/guest/review, skeleton/loading/error/no-allocation messages, summary/mobile affordances | Category changes and total clarity promising; browser flow/retry/keyboard/price updates unverified; hardcoded zero fees and pay-at-property need truthful policy | NOT TESTED runtime; F12/F13/F19 |
| Standalone experience booking | Five steps, date/time refresh, remaining capacity, participant limits, guest/review | Disabled sold-out options and alerts exist; on-request total/expiry/recovery copy needs model review | NOT TESTED runtime |
| Token confirmation | Reference, request vs confirmed heading, room/add-on totals/party/payment; noindex | Useful request/confirmation distinction; no real token browsed; token privacy/status/empty errors need isolated fixture test | NOT TESTED |
| Header/nav/footer | CMS links + code fallback, home normalization, language select, brand and contact links | Mobile focus trap/Escape/scroll lock/focus restoration are implemented; desktop active route styling exists; gallery dialogs do not share this standard | Source positive; new interactive acceptance NOT TESTED |
| SEO/languages | Localized metadata/hreflang helpers, site language, page/entity SEO | Fixed route slug editing and translation key coverage misleading F05/F17; live robots/sitemap origin FAIL F16 | PARTIAL/FAIL by specific defect |

## Admin usability assessment

The workspace has a coherent shell: grouped navigation, work-area tabs, skip-to-content, mobile navigation and input enhancements. Buttons often meet 44–56px targets in source; forms have field errors, pending state and some safe-message mapping. Slug guards, archive confirmations, media-in-use indication and draft/publish messaging are useful. These are source observations, not a measured accessibility or daily-use PASS.

| Area | Strength | Actionable limitation / priority |
| --- | --- | --- |
| Dashboard | Operational summaries and next-action shortcuts | Reconcile metrics with synthetic records and roles; avoid exposing unavailable shortcuts to a role without explanation (P2 validation) |
| Booking workspace | Filters/status/note forms and manual booking, explicit statuses | Test touch, narrow detail view, date/party editing expectations and retry recovery; no full guest/customer workflow certified (F12/F14) |
| Availability calendar | Room/date grid and blocking forms, operational source labels | Verify 320/390px scroll, day headers, target selection, sticky controls, date boundaries and keyboard navigation; avoid expired-hold false refusal F20 |
| Rooms/rates/amenities | Separate units and room types, capacities, quick price and dedicated rate editor | Make shared-price source and editor permissions explicit; ALL is offered but rejected by SQL F27; warn before activating conflicting seasons F04 |
| Experiences/transfers | Content/media/schedule and bookability controls | Specific-date overrides/fleet semantics and excluded content are incomplete (F20); controls should say what actually changes |
| Website content | Central page hub, separate homepage editor, previews/draft/publish | Draft security F01; save atomicity F04; Gallery manager handoff F06; obsolete pages actions F25 |
| Media | Upload panel, filters/pagination, alt/caption editing and recoverable archive | In-use protection incomplete F07; preview modal keyboard handling; title/alt/caption translation claims must match readers |
| SEO/languages | Central metadata and translation completeness view | Fixed-route slug does not create a route, gallery no central metadata, some translation fields ignored F05/F17 |
| Settings/notifications | Plain labels for policies, notification recipients and delivery status | Guest mail/payment switches suggest unavailable behavior F08/F19; show actual provider readiness and aggregate recipient failures F09 |
| Channels | Provider/room target labels, enabled/sync state, export copy | Do not imply Booking.com API/live channel manager; show last successful sync/freshness and unverified automation clearly F10 |
| Error handling | Admin error boundary with Try again; known DB errors mapped to owner-safe messages | Installed Next 16.3.4 documentation and implementation support retry prop: it is not an older reset-only API bug. Some repositories/actions still expose raw service errors or hide missing reads; standardize without hiding failures F18 |

## Ranked improvements and acceptance

1. **P1 trustworthy editing:** fix draft access, partial publication, disconnected translations/gallery and image archive coverage before polish. The UI must not say “published” or “in use protected” when the whole operation did not complete (F01,F04–F07).
2. **P1 truthful booking/notification controls:** resolve retry behavior, actual currency support and guest-email/payment promises. Confirmed vs request/on-request/free must be unmistakable (F08–F14,F19,F27).
3. **P2 accessible dialogs:** share the header's focus discipline with all gallery/admin image dialogs; trap Tab, restore focus, make background inert, retain Escape/arrow support and scroll position (F21).
4. **P2 honest empty/error states:** no cards must distinguish no published items from failed loading for the owner, while public fallback remains safe. Add useful next action without exposing implementation credentials/schema details (F18).
5. **P2 responsive operations:** test authenticated forms, large calendars, long translated labels, validation messages and sticky bars with synthetic data. Source min-height classes do not establish usable layouts (F14,F20,F24).
6. **P3 optional consistency/performance:** consolidate fixed labels/tokens, optimize reviewed font format, check image aspect ratio/overlay consistency and reduced-motion behavior. No redesign or new font family is required.

## Safe visual acceptance plan

Use an isolated test backend and fresh session-free browser, with separately authorized synthetic admin identities. At 320,390,768,1024 and 1440px plus phone landscape: record screenshots, horizontal overflow, long-content wrapping, image crops, footer and fixed bar overlaps. Use keyboard only for navigation/dialog/date/guest controls; check focus visibility/order, Escape, announcements, labels and error associations. Include disabled/empty/loading/offline/expired-hold states, second-language strings and screen-reader/contrast checks. Measure LCP/CLS/INP and font/image payload on a repeatable fixture; no numerical score is claimed here.

The present read-only local preview can support an owner appearance review of the seven allowed pages only. It cannot validate contact, booking, authenticated admin, detail/token pages or writes without a separately isolated target and authorized testing scope. No current visual PASS is invented from HTTP 200 or historical screenshots. See [roadmap](BOREALIS-REMEDIATION-ROADMAP.md) for exact issue acceptance criteria.
