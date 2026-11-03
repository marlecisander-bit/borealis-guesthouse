# Borealis read-only local preview plan

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Production reference rlqyruulxyanfgvnzkpe.

**Safeguards prepared and offline validation PASS; website NOT started.** Source changes are uncommitted and inactive unless the paired local-preview flags are explicitly supplied. The production database, Auth settings, Netlify and Docker were not modified. A complete Next build/browser/runtime acceptance test has not run, so this is preparation approval evidence, not a working-preview claim.

## Configuration verification

Before editing, canonical main HEAD745b4aa56589cda5e5d0c8823ccc1cabb055e313 matched live GitHub main via read-only ls-remote and had no tracked modifications. The tracked changes now present are the preview safeguards and related offline test update listed below. Existing untracked reports, old source snapshot and local Docker evidence remain preserved.

Latest IDE context shows the canonical .env.local, but the actual VS Code open-folder root remains independently unconfirmed; this agent's original environment still names the old snapshot. No workspace switch was performed. All task commands explicitly used the canonical clone. Confirm that folder before eventual startup; open-file location alone does not prove the workspace root.

Production URL remains exact. The public publishable key passed only the approved GET /auth/v1/settings with HTTP200; key and response body were not printed or persisted. .env.local remains Git-ignored. Service-role, Resend, payment/Stripe and calendar-sync credentials remain blank. No key rotation or new project occurred.

## Architecture and activation boundary

The opt-in mode requires BOREALIS_READONLY_PREVIEW=1 and NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW=1 together. Missing counterpart, non-1 values, unexpected project URL, non-isolated build directory, nonlocal application origins, known deployment environment or privileged integration credentials cause rejection. Flags must be absent in normal production configuration; do not add them to Netlify. The mode is application containment for this reviewed source, not an OS firewall or a new read-only database role.

Server instrumentation registers before handling requests and installs a guarded global fetch. The shared Supabase transport also validates its own requests independently. An existing homepage reader that bypassed the shared transport now uses fetchPublicCms. No instrumentation sends telemetry or logs request details.

The proxy now matches every path. In preview it validates before constructing any auth client, denies unknown routes/methods and strips Cookie and Authorization from forwarded requests. This replaces the previous API/image/static exclusions for preview. When preview is off, the previous exclusions are reproduced before the original auth/language logic, preserving the intended production behavior. This widened proxy dispatch has offline regression/type validation but still requires a separately authorized real Next runtime test.

Server Supabase clients ignore cookies and suppress cookie writes in preview. Browser Supabase clients and the server service-role client refuse construction in preview. Browser instrumentation rejects unapproved fetches, disables XHR/WebSocket construction, blocks form submission and blocks ordinary/middle-click navigation outside the route allowlist. A response CSP disallows direct browser Supabase/external connections, forms, frames, workers and external media/images. No authenticated session or cookie is passed upstream. A fresh separate browser profile remains required; there is no promise to erase other browser profiles' cookies or storage.

## Allowed pages and assets

Only GET/HEAD to the exact origin http://127.0.0.1:3000 are accepted for:

- / — published homepage information
- /about
- /rooms — informational listing only
- /experiences — informational listing only
- /transfers — informational listing only
- /explore-koman — informational listing only
- /gallery

Only a bounded lang value and Next's bounded _rsc query token are accepted on page requests. CMS draft/preview parameters, duplicate/unknown parameters and unexpected paths are rejected. Slug detail routes have not been admitted. Nine exact local public SVG assets and safe /_next/static/ paths are allowed. Responses carry no-store, noindex/nofollow and no-referrer headers.

The /contact route is blocked as a whole in this first revision because it includes a submission flow. Links/buttons to disabled features may remain visible but their requests are denied. A future UI-only disabled-state presentation can improve clarity; it is not required to prevent the server request.

## Explicitly allowed Supabase reads

Only server GETs to the exact production HTTPS origin and exact /rest/v1/<table> paths are eligible. No RPC is allowed, including nominally read-only RPCs. No Auth endpoint is in runtime policy; the standalone metadata preflight is separate. No Storage HTTP endpoint is permitted by the runtime guard.

contract.ts freezes 46 exact select projections across 27 reviewed public-reader tables:

amenities, cms_documents, experience_images, experiences, gallery_items, homepage_section_links, homepage_sections, languages, media_assets, navigation_items, page_seo, pricing_rules, properties, rates, reviews, room_images, room_type_amenities, room_types, seasonal_rate_periods, seasonal_rate_room_types, seo_metadata, site_settings, tourism_articles, tourism_categories, transfer_images, transfer_routes and translations.

The projections were extracted from the public repository/site/SEO/translation/homepage/catalog readers and reviewed as a fixed artifact. They exclude wildcard selects, guest/booking/payment/notification/admin records and homepage drafts. Property contact details and published testimonial author names are public informational content, not guest-record access. Published CMS JSON and public media metadata are still content; do not store secrets in those fields.

Only named filter fields, a small eq/neq/in/ilike operator set, simple ordering and limits up to200 are accepted. Duplicate parameters, arbitrary logical clauses, unknown query keys, alternate schemas, credentials in URLs, request bodies, non-GET methods and cross-origin targets fail before delegation. Publication/visibility filters are forced on applicable resources; site_settings requires is_public, languages requires enabled, and active pricing/transfer resources require active. Embedded media projections receive published/visible filters. Existing narrower filters are retained; replacing a caller's draft filter with published intentionally prevents draft access. Explicit public projections and existing production RLS remain the data boundary for junction tables without their own status columns. All queries are capped; datasets over200 may be incomplete until a separately reviewed pagination contract is added.

Upstream headers are rebuilt from the public key and Accept only. Legacy anon keys receive their own Bearer value; caller sessions, cookies, Range, schema switches, method overrides and proxy headers are never forwarded. Redirects fail rather than follow to another target. Unknown requests throw a constant sanitized error; there is no fallback to unrestricted fetch. Application readers that catch errors may render empty/fallback content, which must not be mistaken for verified content completeness.

## Blocked routes and mutations

| Surface | Preview outcome |
| --- | --- |
| /book and all booking/confirmation/token paths | Denied |
| All /api paths, including pricing, booking hold/confirm/experience and contact | Denied, regardless of GET versus POST |
| /admin, server-action POSTs and media uploads | Denied before auth/admin logic |
| Calendar export and synchronization | Denied |
| Auth signup/signin/signout/recovery/refresh and auth RPCs | Runtime requests denied; browser client unavailable |
| Storage reads/writes, signed upload paths and image optimizer | Denied |
| RPC over GET or POST | Denied |
| Unknown public pages, query keys, targets, tables, projections and schemas | Denied |

GET is not treated as inherently safe: only specific resources/projections qualify. The metadata-only preflight is not a broad Auth API permission.

## Browser and host limitations

CSP connect-src self prevents direct browser calls to production; same-origin mutation requests are independently denied by the server proxy. Cookie omission and blocked auth clients avoid normal production session reuse. Client script restrictions supplement server controls and are not trusted as the sole mutation boundary.

The CSP allows self/inline scripts and inline styles for Next rendering; this is not a claim of comprehensive XSS protection. It blocks external image/media/font/frame requests. In particular /_next/image is denied to avoid an arbitrary optimizer fetch path, so remote Supabase images will be unavailable in this first preview. Content may fall back to placeholders or appear without images; do not loosen image policy automatically. A later exact public-media transport needs separate review.

This policy intercepts application fetch and current client entry points, not arbitrary native Node sockets, every possible framework networking implementation, a malicious process, a manually altered build or an owner navigating another browser tab. Browser URL-bar navigation is outside page-level policy. The public key intentionally remains a NEXT_PUBLIC value and may appear in browser bundles; it is public application configuration, not a read-only permission. No service-role secret is embedded. RLS still governs direct use of that public key outside this preview. Stronger host-wide enforcement would require a separately designed OS/network boundary.

## Build/runtime preparation

Read installed Next16.3.4 documentation for proxy, server/client instrumentation, CSP and dotenv behavior. No assumptions from earlier Next middleware versions were used. The original source already imports Manrope and Cormorant Garamond from next/font/google. No font download or full build ran. Existing offline Google Fonts failure remains unresolved: choose reviewed licensed local font assets/source changes, or separately approve narrowly scoped build-time font downloads. Neither option was activated.

Installed Node24.21.0 satisfies package engines >=20.9.0, but Netlify config pins20.19.5. No matching Node20 executable was established and no runtime installation or Netlify version change occurred. Select/review a supported common runtime before claiming reproducibility; passing Node24 offline tests does not prove Node20/browser build parity.

Prepared ignored owner-only .local/readonly-preview-v1 containing:

- source/: 309 source/public/config files including these safeguards; no Git metadata, dotenv, node_modules or prior build output.
- runtime.env.template: inactive paired-flag proposal with blank public key, all privileged integrations blank, exact production URL and localhost origins rewritten to127.0.0.1:3000.
- source-manifest.json and preparation-hashes.json: file provenance for review.
- validation.json: sanitized preparation evidence, explicitly startup_authorized=false and full build NOT RUN.

The actual production key was checked absent from the source snapshot. Canonical .env.local was not copied or changed. This snapshot is not a dependency install or an active runtime. No launcher/daemon was started. Future execution must use a sterile allowlisted environment with clean HOME/TMPDIR, no inherited deployment/cloud/Node preload/proxy credentials, the exact reviewed key supplied privately, and NEXT_DIST_DIR=.next-readonly-preview-v1 in a fresh workspace. Do not use a build compiled without the paired preview flags.

After prerequisites and separate approval, the intended runtime is a reviewed Next production build followed by the pinned Next CLI start with explicit --hostname127.0.0.1 --port3000. This is an architecture description, not an execution instruction for this task. Host port availability, actual loopback listener, runtime guard loading, browser CSP/cookie behavior and cleanup must be checked during the authorized startup. Do not run ordinary npm run dev as a substitute: development HMR/WebSocket/eval needs are deliberately not allowed by this production-style preview policy. No global Docker change is involved.

## Offline validation results

PASS: seven new policy tests and all117 repository unit tests. Tests use synthetic keys and mocked transport delegates, never production booking/admin mutations or SQL. Covered reviewed-route acceptance, all mutation methods, Next server-action header rejection, admin/contact/booking/calendar and unknown-route rejection, personal tables, wildcard/unknown projections, unexpected hosts/schemas/queries, cookie inclusion, caller-auth stripping, no-redirect behavior, CSP restrictions, invalid/mixed flags, deployment/privileged environment rejection and sanitized error messages. Forbidden requests make zero delegate calls; one approved synthetic read reaches only the mock.

PASS: TypeScript noEmit with incremental disabled; targeted ESLint; git diff whitespace check. An existing mocked fetch test needed the new policy import supplied explicitly; its normal production cache/timeout assertions still pass. No test executes Next server startup or a browser. These results do not certify full framework lifecycle enforcement until runtime acceptance is separately authorized.

Source changes: new readonly-preview contract/policy, server/browser instrumentation and tests; updated proxy, Supabase fetch/browser/server/service clients, public homepage reader and the existing mocked transport test. Changes are tracked/untracked working-tree preparation only; no commit, push or deployment. Known production behavior when flags are absent remains the intended baseline, with regression checks; deployment must not happen as a side effect of this work.

## Remaining risks and exact next authorization

Outstanding: canonical VS Code folder confirmation, runtime/font decision, complete Next build under preview flags, real proxy/instrumentation lifecycle validation, actual loopback binding, CSP/session behavior and any missing allowlisted public-read variants. No missing variant should be automatically admitted. Unknown requests remain rejected even if that makes a page incomplete. Production Auth redirect settings remain unchanged and are not needed for a session-free informational preview.

Next approve review/completion of the selected font/runtime prerequisites and a minimal sterile launcher if required, without production mutations. Once the source safeguards and prerequisites are accepted, authorize ONE local read-only preview startup from the reviewed snapshot: only explicit loopback port3000, paired preview flags, fresh artifacts and browser profile, exact production public key, reviewed public table GETs, and public-page/blocked-request smoke checks. Stop on any guard/config/binding failure; no automatic fallback to normal mode. Blocked-request tests must prove zero upstream mutation dispatch and never invoke a live write function.

That authorization must exclude booking/contact/admin/auth/calendar/storage mutations, production data changes, SQL, migrations, production Auth edits, Git publication, Netlify and Docker operations. Shutdown must target only the new preview process by recorded PID; preserve all data and existing Docker resources. No website startup or production-connected browser testing is included in this preparation result.
