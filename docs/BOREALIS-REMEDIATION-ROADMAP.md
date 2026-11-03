# Borealis remediation roadmap

2026-10-20 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Audit only; no fixes or deployment.

**Release decision: NO-GO for a new production release or a claim of fully verified daily operations.** This is a proposed work plan, not authorization to implement it. Priorities describe impact, not proof that an exploit or customer failure occurred. FAIL means the stated code/configuration defect is evidenced; PARTIAL/NOT TESTED retain their explicit uncertainty.

## Order of work

1. Address F01 and review F02/F03 before trusting the production publishing/security boundary. Preserve evidence; do not read draft/guest data to demonstrate exposure.
2. Establish the isolated validation/recovery environment in F14. Reconcile migrations without replaying historical production SQL.
3. Make publication/pricing updates atomic (F04), repair gallery/translation/media connections (F05–F07), and prove booking retry/abuse behavior (F12–F13).
4. Complete and verify email/calendar operations (F08–F11); correct live SEO origin and release hygiene (F15–F17).
5. Complete settings, mobile/accessibility, scale and maintenance work (F18–F27). Cosmetic refinements follow functional/security acceptance.

## F01 — P0 — Published CMS rows expose the draft column

**Status:** FAIL. **Risk:** Critical confidentiality boundary.

**Location:** `src/lib/repositories/admin/site-content.ts:2` (`saveDocument`); `database/migrations/20260902_007_site_content_cms.sql:6,22`; production catalog: `cms_documents_public`, anonymous table SELECT grant.

**Evidence / cause:** Saving a draft on an already-published document writes `draft_data` without changing published status. The catalog records anonymous SELECT on the whole table and a row policy allowing published rows. RLS filters rows, not columns; selecting only `data` in the application does not restrict a different REST client. This is a confirmed permission-design defect in the recorded catalog. No draft value was fetched and no actual disclosure is asserted.

**Impact:** Unpublished editorial material in an otherwise published row can be readable anonymously. The local preview projection guard does not secure the public production API.

**Proposed correction:** Put drafts in a separately protected relation, or expose a deliberately restricted public relation with correctly reduced base-table privileges. Preserve authenticated draft editing and published reads. Avoid a view that accidentally bypasses RLS.

**Dependencies:** Security/schema review and an isolated database with anonymous/editor/owner identities.

**Production database changes:** Yes: a separately approved privilege/schema migration; no migration was executed.

**Recommended tests and acceptance:** Publish synthetic content, save a different draft, then prove anonymous reads cannot select draft material through any exposed relation while the public version remains available. Verify editor preview and publish transaction behavior.

## F02 — P1 — Anonymous callers can execute an internal reference-counter writer

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `database/migrations/20260905_027_booking_engine_completion.sql:22–37`; recorded `next_booking_reference(uuid)` ACL; `expire_booking_holds(uuid)` ACL and definition in migration 021.

**Evidence / cause:** `next_booking_reference` is SECURITY DEFINER, increments `booking_reference_counters`, has no caller authorization and retains explicit anon/authenticated EXECUTE despite revocation from PUBLIC. Expiration is also publicly executable and writes expired holds. These functions were not invoked.

**Impact:** Direct API callers can manipulate reference allocation/workload outside the intended booking transaction. This does not establish a guest-data read or unrestricted booking-creation bypass.

**Proposed correction:** Review function exposure by exact signature. Remove direct public execution of internal writers while preserving calls inside authorized booking functions. Keep intentionally public booking entry points separately validated; do not revoke every RPC indiscriminately.

**Dependencies:** F14 isolated role tests and function call graph.

**Production database changes:** Yes: narrowly approved GRANT/REVOKE migration.

**Recommended tests and acceptance:** Anonymous direct internal-helper execution must be denied; normal synthetic booking creation must still work atomically. Verify expiration remains available through its intended trusted path.

## F03 — P1 — Storage and media retain a second legacy authorization model

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** Recorded `storage.objects` policies “Admins can upload/update/delete public media”; `media_assets` legacy policies plus `media_assets_admin_manage`; `src/lib/admin/auth.ts:18–35`; `database/media-storage.sql`.

**Evidence / cause:** Storage writes check an `admin_users` email match, without current `admin_profiles.is_active`, role or object property-prefix checks. Media metadata has both legacy email-based and current role-based permissive policies. Permissive branches combine with OR. No user memberships were queried.

**Impact:** Revocation in the current admin model may not revoke legacy storage access; a current profile absent from the legacy table may instead fail uploads. Actual affected accounts and cross-property writes were not tested.

**Proposed correction:** Consolidate policies around active membership, approved role and property/object prefix. Inventory legacy membership safely before removal. Keep public image GET semantics separate from write authorization.

**Dependencies:** F14 role fixtures, owner-approved role model and storage policy reconciliation.

**Production database changes:** Yes: reviewed policy migration; membership edits require separate authorization.

**Recommended tests and acceptance:** Disabled users, staff and another-property users cannot upload/update/delete; authorized editors can operate only their property. Test direct Storage and metadata APIs, not just the upload UI.

## F04 — P1 — Multi-step admin saves can leave partial public changes

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/repositories/admin/homepage.ts:4`, `site-content.ts:2`, `rates.ts` (`saveSeason`), `rooms.ts` (`saveRoomType`), `languages.ts` (`saveLanguage`), `settings.ts:40–65`, `transfers.ts` (`save`).

**Evidence / cause:** Homepage publication upserts sections, deletes/inserts links and archives/replaces reviews in separate HTTP transactions. Navigation archives existing items before upsert. Seasonal rates save a period before replacing links. Default-language change clears defaults before saving the new one. Room/settings/media-linked saves are similarly multi-step; some delete/update errors are ignored.

**Impact:** A later failure can leave changed pricing, missing links, incomplete publication or no default language even when the UI reports an error. No production partial failure was induced.

**Proposed correction:** Use bounded, property-authorized database transactions for related relational updates; validate before mutation and check every result. For Storage plus DB work, define idempotent compensation and surface cleanup failure.

**Dependencies:** F14 failure-injection fixtures; publish/version model.

**Production database changes:** Likely yes for transactional RPCs; application-only error handling is also needed.

**Recommended tests and acceptance:** Inject failure at every step and prove the previous complete state remains or recovery is explicit. Parallel saves must not overwrite an unrelated edit silently. Public cache invalidation occurs only after commit.

## F05 — P1 — Several translation controls do not feed the displayed fields

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/repositories/admin/languages.ts:5,20`; `src/lib/repositories/public/content.ts:22–24`; `src/lib/seo.ts` (`getPageSeo`); public image readers.

**Evidence / cause:** The admin offers room/experience `short_description`, experience `full_description` and transfer `short_description`. The public mappings read `description` and, for experiences, `long_description`, instead. Page SEO reads translations of entity type `page_seo`, but that entity is not enumerated by the language dashboard. Media alt/caption translation controls exist while the inspected image readers use base asset fields.

**Impact:** An owner can publish a translation that never appears, despite a completeness indicator. Names, homepage fields, document fields, article text and some other translations do have matching readers.

**Proposed correction:** Share an explicit typed translation field contract between editors and readers, migrate existing keys deliberately, and either connect or remove unsupported controls.

**Dependencies:** Translated fixture catalog and content decisions; F01 draft protection.

**Production database changes:** Possibly: existing translated keys may need a reviewed data migration; code alignment alone is insufficient if data already uses old keys.

**Recommended tests and acceptance:** Save/publish each offered field in a synthetic second language, assert its exact public output, language fallback and metadata. A dashboard cannot report a field complete when no reader consumes it.

## F06 — P1 — Gallery image management is not connected to gallery membership

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/app/admin/content/gallery/page.tsx:23–26`; `src/app/admin/media/upload/route.ts`; `src/components/admin/MediaLibrary.tsx`; `src/lib/repositories/public/content.ts:26`.

**Evidence / cause:** The Gallery editor directs the owner to Media Library. Upload creates `media_assets`; the public gallery requires a separate published `gallery_items` join. No current source action inserts/reorders/categories/features `gallery_items`; recorded triggers do not synchronize it from uploads.

**Impact:** Uploading a photograph is not enough to add it to the public gallery. The UI description implies a connection that is incomplete. Existing gallery rows can still render.

**Proposed correction:** Provide explicit gallery membership/order/category/feature controls that write the intended relation, or adopt a reviewed single-source model. Do not automatically publish every uploaded photograph.

**Dependencies:** Media authorization F03 and reference safety F07.

**Production database changes:** Not necessarily schema changes; application writes to the existing relation require isolated validation.

**Recommended tests and acceptance:** Upload synthetic media, explicitly add/reorder/remove it in the gallery, publish, and prove public output and archive protection follow membership.

## F07 — P1 — Archive protection misses published media references

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/repositories/admin/media.ts:9–25` (`publishedReferences`); `src/services/site-content.ts:12–13`; `src/lib/seo.ts`; `src/services/database-articles.ts`.

**Evidence / cause:** The guard checks many relational references but omits landing-page `cms_documents.data.heroImageId`, `page_seo.og_image_id` and article media arrays/blocks. About also stores direct URLs. Those readers can continue to refer to an asset the guard considers unused.

**Impact:** An owner can archive an image still used by published content; readers requiring published media then omit it or use a placeholder. This is a static coverage defect, not an observed production archive.

**Proposed correction:** Build a complete reference contract or normalized asset links, including JSON/direct-URL compatibility. Check it atomically enough to prevent concurrent publish/archive races.

**Dependencies:** F04 transaction design and F06 gallery controls.

**Production database changes:** Maybe: normalization/RPC approach may require schema work.

**Recommended tests and acceptance:** For every supported reference type, published use prevents archive; replacing/unpublishing the final reference allows archive. Test draft-only use and concurrent publish/archive separately.

## F08 — P1 — Guest confirmation email setting has no sender

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/repositories/admin/settings.ts:31,60`; `src/lib/notifications/service.ts`; `database/migrations/20260905_031_owner_notifications.sql:150–184`.

**Evidence / cause:** `guest_confirmation_enabled` is stored and shown but has no consuming delivery implementation in current source. The SQL queue resolves owner notification addresses; the mail template links to admin booking details. A public confirmation page is implemented, which is a different feature.

**Impact:** The guest must not be promised a confirmation email based on this setting. No email was sent in this audit.

**Proposed correction:** Either implement a distinct guest-safe confirmation delivery flow with documented consent/content or label/disable the unused control. Never send the owner template, which contains operational/private detail, to guests.

**Dependencies:** F09 delivery reliability, approved sender/domain and isolated mail capture.

**Production database changes:** Possibly: queue/recipient schema changes; separate integration authorization required.

**Recommended tests and acceptance:** Toggle on/off against synthetic bookings and mail capture. Guest receives only their approved confirmation content; owner notification and guest mail remain separate and retry safely.

## F09 — P1 — Owner email delivery lacks durable claiming and retry recovery

**Status:** PARTIAL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/notifications/service.ts:14–64`; `resend-channel.ts`; booking confirm/admin actions; migration 031 unique notification/delivery keys.

**Evidence / cause:** Dispatch reads pending rows, sends, then updates status; there is no atomic delivery claim/provider idempotency key. Failed rows are not selected on another pending-only pass; attempt_count is set to 1. No retry worker/scheduler was found. In-app notification uniqueness is useful but is not external-send idempotency. Modified-event dispatch coverage is incomplete.

**Impact:** Timeouts/concurrent callbacks can lose or duplicate email; configured email is not reliable merely because a booking commits. Local credentials are intentionally blank; production delivery is NOT TESTED.

**Proposed correction:** Use a durable outbox worker with lease/claim, bounded retries/backoff, idempotency and observable terminal failures. Verify all event types and aggregate status across recipients.

**Dependencies:** F14 isolated backend, mail capture, separately approved provider configuration.

**Production database changes:** Likely yes for claim/lease metadata or transactional worker RPC.

**Recommended tests and acceptance:** Provider timeout before/after acceptance, concurrent workers and process exit must not lose a delivery or duplicate it beyond documented guarantees. Retry failed rows and expose per-recipient outcome.

## F10 — P1 — Automatic calendar synchronization is not established

**Status:** PARTIAL. **Risk:** High functional/security/release risk.

**Location:** `src/app/api/internal/calendars/sync/route.ts:6–16`; `src/services/ical-sync.ts`; `netlify.toml`; `docs/ical-channel-sync.md`.

**Evidence / cause:** A secret-protected batch endpoint and owner-only manual action exist. Repository configuration contains no scheduled function/job implementation; documentation proposes one. No current remote scheduler inventory or feed execution was available.

**Impact:** Cross-channel inventory can become stale if an owner assumes automatic import is running. This is an unverified operational dependency, not proof that a remote scheduler does not exist.

**Proposed correction:** Inventory existing schedules read-only; implement/verify one approved schedule only in staging first, with freshness alerting, overlap handling and timeout budget.

**Dependencies:** F11 safe downloader; service credentials and scheduler authorization; isolated feeds.

**Production database changes:** Not necessarily; infrastructure/configuration change needs separate approval.

**Recommended tests and acceptance:** A fake feed change appears within the stated interval; stale/error state is visible; duplicate schedules and overlapping jobs remain safe. Do not test with real channel reservations.

## F11 — P1 — Calendar URL protection does not pin the validated DNS destination

**Status:** PARTIAL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/ical/fetch-feed.ts:17–39`.

**Evidence / cause:** The code validates DNS results with `lookup`, then passes the hostname to fetch, which can resolve it again. Redirects are rejected and many private ranges are checked, but no connection-to-validated-address binding exists. The 2 MB check after response.text also happens after buffering. No rebinding attempt was made.

**Impact:** A malicious/rebound calendar host could bypass the intended private-network boundary. Exposure is limited by owner-only configuration/secret-controlled sync, but the privileged fetch path still needs hardening.

**Proposed correction:** Use a supported transport that pins and verifies the approved connection destination while preserving TLS hostname checks, complete reserved-address handling and streaming byte/time limits.

**Dependencies:** Isolated DNS/HTTP fixtures and approved Node transport design.

**Production database changes:** No production DB change required for transport correction.

**Recommended tests and acceptance:** Simulated DNS change, mapped IPv 6, private/reserved destinations, redirects, oversized chunked bodies and timeouts fail closed without private-network dispatch.

## F12 — P1 — Booking retry behavior is not idempotent

**Status:** PARTIAL. **Risk:** High functional/security/release risk.

**Location:** `src/components/booking/BookingFlow.tsx:72–77`; `ExperienceBookingFlow.tsx` (`confirm`); `src/services/booking.ts`; migration 038 `confirm_booking_hold:139–160`.

**Evidence / cause:** Each UI confirm attempt creates a new hold. SQL confirm selects only an unexpired held row, so a repeated confirm after a successful commit cannot return the same successful result. No client request idempotency key or recovery contract was found.

**Impact:** An interrupted response can show failure after a successful reservation; retry can reserve extra inventory. Database transactions prevent partial SQL execution, but do not solve response-loss recovery.

**Proposed correction:** Persist a scoped request identity/hold on the client and implement authorized idempotent create/confirm recovery. Return existing success only after validating the correct token/request identity.

**Dependencies:** F14 deterministic transaction tests; notification F09 idempotency.

**Production database changes:** Likely yes: idempotency key/uniqueness and RPC behavior.

**Recommended tests and acceptance:** Lose the response after commit and retry; exactly one reservation and intended notification remain. Duplicate calls and expired tokens give deterministic outcomes without leaking another booking.

## F13 — P1 — Public holds and pricing lack an evidenced abuse budget

**Status:** PARTIAL. **Risk:** High functional/security/release risk.

**Location:** `src/app/api/bookings/hold/route.ts`; `src/app/api/bookings/experience/route.ts`; `src/app/api/pricing/route.ts:18–31`; `src/lib/booking/search-criteria.ts:15–30`; public SQL hold entry points.

**Evidence / cause:** Normal unauthenticated holds intentionally reserve inventory. No per-client/risk quota or explicit request body/stay-length cost budget was found in these application entry points. Pricing fans out by room type and occupancy; date validation does not cap the interval. Platform edge controls were not inspected.

**Impact:** Repeated holds can exhaust inventory and large quote ranges can create database work. No load/abuse test was performed and no actual exhaustion is claimed.

**Proposed correction:** Define proportionate hold quotas/expiry, request size and date/compute limits at every exposed boundary, including direct public RPC access. Monitor rejection/error rates; do not assume a Next-only limiter protects direct Supabase RPCs.

**Dependencies:** Owner-approved traffic expectations and isolated load tests.

**Production database changes:** Possibly for DB-enforced quotas; edge limits/configuration also require review.

**Recommended tests and acceptance:** Bounded synthetic bursts and extreme date/body inputs cannot exhaust inventory or exceed the agreed work budget; ordinary family/multi-room bookings remain usable.

## F14 — P1 — A complete safe functional and recovery certification is missing

**Status:** NOT TESTED. **Risk:** High functional/security/release risk.

**Location:** `database/tests/*.sql`; `tests/e2e/*.spec.ts`; `playwright.config.ts:73–90`; existing local-development/production-sync reports.

**Evidence / cause:** The 125 tests run in this audit are unit/static/mock checks, not a transactional database or authenticated admin E 2E suite. SQL scenarios exist but were not run on production. Migration ledger is absent in recorded metadata; all migration application states cannot be inferred from matching function bodies. Backup restore and live role negative tests are unverified.

**Impact:** Bookings, cancellation/release, role boundaries and admin publication are not certified for real customers. This is a release-blocking evidence gap, not evidence of actual double booking.

**Proposed correction:** Establish an independently isolated backend with synthetic data, reconcile a reproducible schema baseline, run all safe DB/concurrency/admin E 2E suites and rehearse recovery. Existing Playwright default starts unrestricted dev and must not be used against production credentials.

**Dependencies:** Owner-approved isolated target and migration reconciliation; no production migration replay.

**Production database changes:** A dev baseline is needed; whether production needs changes must be decided from a reviewed schema diff, never by replaying old files.

**Recommended tests and acceptance:** Last-room concurrent holds, block/import races, confirmation/cancellation, roles, save failures, pricing parity and backup restore all pass on recorded versions with sanitized evidence.

## F15 — P1 — Private runtime/browser material is not excluded from Git

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** Canonical `.gitignore`; current `git status --short` shows `?? .local/`; prior Netlify metadata records main auto-publishing enabled.

**Evidence / cause:** The private local build/launcher/profile/evidence directory is untracked but not ignored by the repository. Source has ten pre-existing tracked modifications and several untracked preview modules/fonts/reports. Nothing was staged or published by this audit.

**Impact:** A broad add/push could publish browser/runtime evidence and an unreviewed preview patch and trigger deployment. No credential leak or prior accidental push is asserted.

**Proposed correction:** Review and exclude private runtime/profile/evidence material before any staging; scan the intended publish set privately and publish only an explicitly reviewed source diff. Keep runtime markers historical. Review auto-deploy behavior before a push.

**Dependencies:** Separate source-publication authorization and a release inventory.

**Production database changes:** No DB change.

**Recommended tests and acceptance:** Git status/check-ignore and a staged-file review prove private profiles, cache, runtime configuration and receipts cannot enter the intended release; no preview flag is set in hosting.

## F16 — P1 — Production SEO advertises localhost

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/app/robots.ts:1`; `src/app/sitemap.ts:4`; `src/app/layout.tsx:12`; live read-only GETs of production `/robots.txt` and `/sitemap.xml` in this audit.

**Evidence / cause:** Both live endpoints returned 200. robots.txt names a sitemap on http://localhost:3000; sitemap page URLs also use that origin. The code falls back there when NEXT_PUBLIC_SITE_URL is absent. This is current public evidence, not only an environment-name inference.

**Impact:** Search engines receive unusable canonical discovery URLs; production metadataBase, breadcrumbs and mail/calendar link defaults need a consistent origin review.

**Proposed correction:** Set and validate the canonical deployment origin through separately approved hosting configuration/build, fail unsafe production defaults, then verify sitemap/canonical/hreflang/structured-data links.

**Dependencies:** Netlify environment/deployment approval after security gates; F17 route semantics.

**Production database changes:** No DB change required for the origin itself.

**Recommended tests and acceptance:** All public production discovery/canonical URLs use the intended HTTPS host; none uses localhost or preview host. Preview retains noindex and loopback origin.

## F17 — P2 — SEO URL editing is disconnected from static routes

**Status:** FAIL. **Risk:** Moderate operational/quality risk.

**Location:** `src/app/admin/seo/actions.ts:2`; `src/lib/repositories/admin/seo.ts` (`savePage`); `src/lib/seo.ts` (`getPageSeo`); `src/app/sitemap.ts`; `src/app/gallery/page.tsx:7`.

**Evidence / cause:** Changing page_seo.slug changes emitted canonical/sitemap paths but does not create a new Next route or redirect. seo_redirects exists in the catalog but has no runtime consumer found. Gallery metadata is hardcoded and outside the central seven-page SEO editor; sitemap includes gallery unconditionally and filters article noindex but not room/experience/transfer noindex.

**Impact:** An SEO edit can advertise a nonexistent URL. Central controls do not cover every public page consistently. No owner edit or resulting production 404 was induced.

**Proposed correction:** Keep fixed-route paths code-controlled unless full routing/redirect support is implemented; unify page/entity noindex and gallery metadata handling.

**Dependencies:** F16 canonical origin; SEO content requirements.

**Production database changes:** Not necessarily; redirects/data correction may require a reviewed migration if adopted.

**Recommended tests and acceptance:** Changing SEO text never changes route existence; every indexed sitemap entry resolves, excluded entities are omitted, and gallery supports the intended metadata controls.

## F18 — P2 — Fallbacks and property selection hide data-source failures

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `src/services/site-content.ts:12–37`; `database-rooms.ts`, `database-experiences.ts`, `database-transfers.ts`, `database-articles.ts`; `src/lib/repositories/public/content.ts:20,26–28`.

**Evidence / cause:** Readers often return empty/default content on query errors. Several document/language/navigation reads do not explicitly select property, and property readers choose the first published property. This can work for one property but is not a multi-property selection contract. HTTP 200 is not CMS completeness evidence.

**Impact:** An outage or duplicate matching record may look like an empty legitimate page; another property would make implicit selection ambiguous. Actual multi-property deployment is not established.

**Proposed correction:** Add sanitized source/error observability and explicit property scoping; preserve appropriate visitor fallback while alerting owners to missing data.

**Dependencies:** Agreed single-property/multi-property architecture; isolated failure fixtures.

**Production database changes:** Usually code; data uniqueness may require a reviewed constraint.

**Recommended tests and acceptance:** Simulated database failure is visible operationally without private detail; public text provenance is testable and another-property fixture cannot bleed into the site.

## F19 — P2 — Some policy settings are stored without full behavioral enforcement

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `src/lib/repositories/admin/settings.ts:6,27–31,53–60`; `src/services/site-content.ts:35–37`; `src/app/book/page.tsx`; migration 027 hold settings.

**Evidence / cause:** maximum_guests and minimum_booking_holder_age have no demonstrated booking enforcement consumer beyond settings/public policy retrieval; category counts do not verify age. Admin missing-row defaults for advance/horizon differ from SQL fallback values. Payment/deposit flags do not implement payment collection.

**Impact:** The owner may interpret stored policy controls as enforced business behavior. Actual configured production values were not read, so a live mismatch is not asserted.

**Proposed correction:** Document/enforce each supported setting, align defaults in one contract and hide/label informational or inactive controls. Decide whether age needs an attestation rather than collecting unnecessary identity data.

**Dependencies:** Business policy decisions and F14 settings-to-behavior tests.

**Production database changes:** Possibly data/default alignment; no automatic production setting changes.

**Recommended tests and acceptance:** Each editable switch/limit has a tested consumer or explicit informational/inactive label. Missing settings behave consistently across admin, search and final SQL.

## F20 — P2 — Operational inventory controls have limits that the owner must understand

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `src/components/admin/ExperienceForm.tsx`; `src/lib/repositories/admin/experiences.ts`; migration 033; migration 029 transfer branch; `src/lib/repositories/admin/availability.ts` (`createBlock`).

**Evidence / cause:** Experience operating schedule fields exist, but a full per-date/time override CRUD editor was not found for experience_availability. Transfer capacity limits one request; no aggregate vehicle/seat reservation ledger is present. Manual block precheck includes expired held bookings without filtering expiry, while the SQL guard correctly excludes expired holds.

**Impact:** Specific-date management may require unavailable tools; shared transfer seats could be over-promised if treated as a fleet ledger; stale holds may block an admin action unnecessarily. No real conflict was created.

**Proposed correction:** Choose and label supported operating models; add explicit slot/override management and, only if shared inventory is required, a proper transfer ledger. Align block prechecks with authoritative expiry semantics.

**Dependencies:** Owner operating requirements and isolated capacity tests.

**Production database changes:** Maybe for shared transfer inventory; existing experience table can support an editor.

**Recommended tests and acceptance:** Owner can manage supported dates safely; combined standalone/add-on bookings share capacity; expired holds do not cause false blocking; transfer semantics match the sold service.

## F21 — P2 — Gallery dialogs do not provide a complete keyboard focus lifecycle

**Status:** FAIL. **Risk:** Moderate operational/quality risk.

**Location:** `src/components/public/RoomGallery.tsx:10–34`; `GalleryExplorer.tsx`; `ExperienceGallery.tsx`; compare Header.tsx mobile focus handling.

**Evidence / cause:** Dialogs implement Escape/arrow handling and modal semantics, but the inspected room gallery has no focus trap or trigger-focus restoration. Other gallery dialogs need the same systematic check. Header mobile navigation does implement focus trapping and restoration.

**Impact:** Keyboard users can leave the modal or lose their location after closing. No assistive-technology/live browser audit was performed.

**Proposed correction:** Use a shared accessible dialog primitive with focus containment, restoration, background inertness and stable scroll restoration; audit all custom galleries/date controls.

**Dependencies:** Isolated browser/keyboard tests at supported widths.

**Production database changes:** No DB change.

**Recommended tests and acceptance:** Tab/Shift-Tab stay inside, Escape closes, focus returns to the invoking thumbnail and background controls are inaccessible while open. Screen-reader labels and contrast pass review.

## F22 — P2 — Admin preview destination validation accepts protocol-relative redirects

**Status:** FAIL. **Risk:** Moderate operational/quality risk.

**Location:** `src/app/admin/preview/route.ts:7–17`.

**Evidence / cause:** allowedPrefixes includes `/`, making startsWith(prefix) accept every slash-prefixed destination. A `//other-host/path` returnTo passes that string check and new URL resolves it externally. Entry requires an authorized editor; no redirect request was sent.

**Impact:** An authenticated preview link can redirect off-site, undermining the intended destination restriction. This does not by itself grant anonymous draft access.

**Proposed correction:** Parse against the trusted origin, require same origin and an exact allowed route pattern, reject protocol-relative/backslash/encoded ambiguity, and bind preview type/id to route.

**Dependencies:** Installed NextRequest synthetic tests; preserve F01 draft authorization.

**Production database changes:** No DB change.

**Recommended tests and acceptance:** All external/protocol-relative/ambiguous destinations fail in synthetic tests; approved same-origin preview links still enable authenticated preview.

## F23 — P2 — Runtime/dependency support and test command need alignment

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `netlify.toml` NODE_VERSION; `package.json` engines/scripts/dependencies; `package-lock.json`; pinned audit Node binary.

**Evidence / cause:** Node 20.19.5 works for this build but is out of support at the audit date. package engines >=20.9 permits unbounded future majors. Tests pass on Node 20 through the reviewed TypeScript loader; the ordinary node --test *.ts script is not a portable Node 20 TypeScript setup. Both auth-helpers packages remain installed alongside @supabase/ssr; no current imports were found for the old helpers.

**Impact:** Reproducibility/security maintenance is incomplete even though npm ls and current tests pass. This audit did not obtain a current advisory database, so no zero-vulnerability claim is made.

**Proposed correction:** Review a supported common Node target, test deployment parity, standardize the TS test runner and remove unused dependencies only after import/build validation. Perform a separate current dependency advisory review.

**Dependencies:** Hosting/runtime change approval; isolated release checks.

**Production database changes:** No DB change.

**Recommended tests and acceptance:** One documented supported runtime runs install, unit, lint, type, production build and hosting checks. Advisory exceptions are explicit and time-bounded.

## F24 — P2 — Admin list and quote cost need scale tests

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `src/lib/repositories/admin/bookings.ts` (`list`); `src/app/api/pricing/route.ts:18–31`; multiple admin option/list readers.

**Evidence / cause:** Booking filters can scan successive 100-row batches and filter in memory to fill a page; quote requests fan out by room and occupancy. Some option lists are unpaginated. No production query timings, EXPLAIN plans or complete secondary-index inventory were collected.

**Impact:** Performance can degrade with booking/history volume. This is a code-path scalability risk, not an observed slow-production incident.

**Proposed correction:** Push bounded filters/pagination into indexed queries, set work budgets and measure realistic synthetic volumes before tuning. Do not add speculative indexes to production.

**Dependencies:** F13 abuse limits and isolated representative data.

**Production database changes:** Only if measured plans justify reviewed indexes/RPCs.

**Recommended tests and acceptance:** Agreed response-time/query-count/memory targets pass at expected peak/history volumes; all filters return complete deterministic pages.

## F25 — P2 — Legacy content paths increase source-of-truth ambiguity

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `src/lib/repositories/admin/cms-pages.ts`; `src/app/admin/content/actions.ts`; `src/services/content.ts`; schema tables pages/content_pages/cms_documents and old availability/rate_rules/transfers.

**Evidence / cause:** Old homepage actions still write pages, while the active editor writes homepage_sections/homepage_drafts. No current component imports the old saveHomepage action were found. Legacy tables/repositories and compatibility aliases coexist; old route aliases intentionally redirect. Homepage highlights are read/typed but not persisted by the active save path or rendered as the removed highlights section.

**Impact:** A maintainer can wire an obsolete editor and save data the public site never reads. Compatibility redirects themselves are not defects.

**Proposed correction:** Document the authoritative model, mark/deprecate dead exports, then remove only after call-site/data migration review. Do not delete historical tables or reintroduce intentionally removed UI blindly.

**Dependencies:** F14 schema reconciliation and connection matrix.

**Production database changes:** Not necessarily; cleanup/migration would need a separate approved plan.

**Recommended tests and acceptance:** Every reachable editor has exactly one documented reader/source; legacy aliases redirect as intended and no orphan control claims to publish.

## F26 — P2 — Owned shutdown is safe but its result reporting still has an exit race

**Status:** PARTIAL. **Risk:** Moderate operational/quality risk.

**Location:** `.local/readonly-images-v7/launcher.py`, `ownership.py`; `docs/BOREALIS-LOCAL-IMAGE-PREVIEW.md`; prior v4/v5/cache reports.

**Evidence / cause:** Stable PID/start microseconds/group/executable/cwd/title checks are implemented and mocked regressions pass. Historical shutdown inspection nevertheless reported rejection while the owned process was exiting; final absence and port release were verified separately. The audit did not stop the running preview.

**Impact:** An owner can see an alarming failed-stop result despite a stopped server. Broad kill-by-name/port is not an acceptable workaround.

**Proposed correction:** Make inspection disappearance handling return success only after verified owned-PID absence and port release; retain PID-reuse rejection and bounded waiting.

**Dependencies:** Mocked race tests plus a separately authorized harmless process lifecycle check.

**Production database changes:** No DB change; new sealed launcher revision if changed.

**Recommended tests and acceptance:** Already-exited, inspection-exit, signal-exit and PID-reuse cases report correctly; unrelated processes are never signaled and occupied ports are not killed.

## F27 — P1 — Albanian Lek is offered by admin but rejected by room/package SQL

**Status:** FAIL. **Risk:** High functional/security/release risk.

**Location:** `src/lib/currencies.ts:5`; `src/lib/admin/room-validation.ts:32`; `database/migrations/20260905_027_booking_engine_completion.sql:73`; migration 029 add-on currency check.

**Evidence / cause:** The supported currency list explicitly defines ALL as Albanian Lek and the admin accepts it. calculate_room_stay_price raises an error when target_currency=ALL; package add-ons also reject addon_currency=ALL. The recorded current function-body reconciliation links these definitions to production metadata. The standalone experience path does not apply the same rejection. No production rate values or booking were queried.

**Impact:** A legitimate owner-selected currency can make room quotations/holds fail, and currency support differs by booking path. Whether any current product uses ALL is unknown.

**Proposed correction:** Treat ALL as the ISO currency code, not an all-currencies sentinel. Align supported currency behavior across editor, JS catalog, room/package/standalone SQL and formatting; retain rejection of mixed currencies.

**Dependencies:** F14 isolated SQL price/booking fixtures; owner currency policy.

**Production database changes:** Yes: reviewed SQL function correction if the recorded production definition remains current; no data conversion without separate review.

**Recommended tests and acceptance:** Synthetic EUR/USD/GBP/ALL stays and add-ons calculate correctly; mixed-currency packages still fail. Each selectable currency works consistently through quote, hold, confirm and confirmation display.

## P3 optional improvements

After the above acceptance: optimize local TTF delivery into reviewed WOFF 2 assets without changing font families/weights; consolidate duplicated fixed UI labels and spacing tokens; refine disabled-state copy for the restricted preview. These are recommendations, not proven production regressions. No redesign is necessary to resolve the identified blockers.

## Safe implementation boundary

Every fix requires its own reviewed scope. Production SQL/policy/settings changes, provider sends, real calendar sync, Git publication and deployment remain outside this audit. First test against synthetic isolated data and mail/feed fixtures. A production release needs a reviewed minimal migration diff, verified backup/recovery plan, runtime/role/concurrency acceptance, source-only staged diff and explicit deployment authorization.
