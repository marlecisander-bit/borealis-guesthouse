# Borealis production-safe local setup

Audit date: 2026-10-19, Europe/Tirane. Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

## Readiness and boundaries

The owner confirms that `rlqyruulxyanfgvnzkpe` is the only Borealis Supabase project and is PRODUCTION. There is no development/staging database. No Supabase requests, browser automation, website startup, SQL, migrations, authentication, booking, email, synchronization, or storage operations were performed during this audit. No application source, dependency, lockfile, Git commit, remote, or deployment configuration was changed. Only local checks/caches and this documentation were produced.

The IDE-supplied active-file path is in the canonical clone. Independent inspection of VS Code's open folder was blocked because native Computer Use permission is unavailable. Opening a file from a clone alone does not establish the workspace folder. All shell checks used the canonical clone explicitly. Confirm the Explorer root is `borealis-guesthouse`, not `borealis-guesthouse-main`.

## Local environment

Existing `.env.local` was preserved. Its URL matches `https://rlqyruulxyanfgvnzkpe.supabase.co`. `.gitignore:37` matches `.env*`; `.env.local` is ignored and not tracked. No credential values are included here.

Public-key status: placeholder.

The application reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Enter the public key after `=` on that line in `.env.local`, replacing the placeholder if still present. Do not rename the variable. Do not use a service-role key or `sb_secret_` key in any public variable.

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `PAYMENT_PROVIDER_SECRET`, and `ICAL_SYNC_SECRET` are empty. Keep them empty. APP_URL, NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_SITE_URL use localhost values. Existing configuration was not overwritten.

## Client initialization and compatibility

Installed Supabase JS 2.113.0 and SSR 0.12.5 accept legacy anon JWTs and modern publishable keys. SDK constructor/fetch source explicitly handles `sb_publishable_` keys; no JWT-only parsing is imposed by application initialization. Runtime acceptance by this production project remains untested.

Initialization paths reviewed:

- `src/lib/supabase/client.ts`: SSR browser client using public URL/key; session persistence, token refresh and URL-session detection default on in browsers.
- `src/lib/supabase/server.ts`: cached SSR client using request cookies. SSR automatic refresh timer is off, but an auth/session read can still refresh an expired session and write cookies.
- `src/proxy.ts`: creates SSR client for matched pages; language parameter reads `languages` and sets a language cookie; admin paths call auth.getUser and query admin_profiles. Never treat admin GET as free of auth side effects.
- `src/lib/supabase/public-cms.ts`: public singleton, no persistent session, refresh or URL-session detection; caches explicitly allowed GET table reads. Custom fetch sets a timeout, not read-only enforcement. Non-GET requests are still forwarded.
- `src/lib/supabase/service.ts`: privileged server client; missing service-role secret prevents use. This does not prevent public-key booking/contact RPC writes.
- Direct public clients in services/media, translations, global-seo, pricing, homepage-cms; lib/seo; repositories/public/content and homepage; calendar export handler. These use public URL/key, mostly disabling session persistence and automatic refresh. Preview branches can switch to cookie-authenticated server clients.
- Browser consumers include useAuth, NotificationBell, RoomImagesManager and HeroImageFields. The latter paths can update notification rows or upload files on user interaction.

No separate NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fallback exists; both supported public key formats go in the existing ANON_KEY variable. Legacy auth-helper dependencies are installed but current client factories use SSR/JS. No dependencies changed.

## Classification definitions and limits

Verified read-only means the reviewed application path performs SELECT/public content reads, with no identified write/RPC mutation, under the stated no-cookie/no-preview conditions. It is static source verification, not proof of live database policies, function bodies, extensions or triggers. Potentially mutating includes session refresh, browser effects, authenticated/preview paths or cookie changes. Confirmed mutating means code explicitly issues writes/auth mutations, or invokes a checked-in side-effecting RPC. Unknown covers live infrastructure/function drift and unreviewed external behavior.

Read-only public pages below are candidates only for separately approved, cookie-free HTTP GET checks without JavaScript, forms, query parameters, preview state, redirects into admin, or speculative browser prefetch. No candidate is approved for execution by this report.

## Route inventory

Each checked-in page and explicit handler is listed below. Classifications describe the request method and its execution path, not all operations reachable through links on a page.

| Method / route | Classification | Evidence / condition |
| --- | --- | --- |
| GET `/about` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/admin/amenities` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/availability` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/bookings/[id]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/bookings/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/bookings` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/channels/booking-com` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/channels` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/[section]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/about` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/book` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/contact` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/footer` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/gallery` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/global` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/homepage` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content/navigation` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/content` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/dashboard` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/experiences/[id]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/experiences/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/experiences` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/explore-koman/[id]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/explore-koman/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/explore-koman` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/inquiries` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/languages` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/login` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/media` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/notifications` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/pages` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/rate-rules` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/rates` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/room-types/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/room-types` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/rooms/[id]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/rooms/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/rooms` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/seo` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/settings` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/transfers/[id]` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/transfers/new` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/admin/transfers` | Potentially mutating | Proxy/auth session reads; admin layout and interactive write controls. Do not test. |
| GET `/book/experience/[slug]` | Potentially mutating | Booking UI; date parameters auto-request pricing / experience availability. Excluded from smoke tests. |
| GET `/book` | Potentially mutating | Booking UI; date parameters auto-request pricing / experience availability. Excluded from smoke tests. |
| GET `/booking/confirmation/[token]` | Potentially mutating | Cookie-aware SSR client and confirmation RPC; private booking data. Excluded. |
| GET `/contact` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/experiences/[slug]` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/experiences` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/explore-koman/[slug]` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/explore-koman` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/gallery` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/rooms/[slug]` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/rooms` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/transfers/[slug]` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| GET `/transfers` | Verified read-only | Public SELECT rendering only for cookie-free, no-preview GET; browser interactions excluded. |
| POST `/api/admin/login` | Confirmed mutating | signInWithPassword; signOut for unauthorized user; auth side effects. |
| POST `/api/bookings/hold` | Confirmed mutating | create_multi_room_booking_package_hold: booking/package/guest/item/reservation writes. |
| POST `/api/bookings/confirm` | Confirmed mutating | confirm_booking_hold updates booking; after() notification dispatch. |
| GET `/api/bookings/experience` | Potentially mutating | Checked-in get_public_experience_slots is SELECT-only; cookie-aware SSR client and live RPC drift remain. |
| POST `/api/bookings/experience` | Confirmed mutating | create_experience_booking_hold inserts booking/guest/items. |
| POST `/api/contact` | Confirmed mutating | submit_contact_inquiry inserts inquiry; do not submit forms. |
| POST `/api/pricing` | Potentially mutating | Checked-in available_room_count and calculate_room_stay_price are read-only; SSR sessions/live RPC drift unverified. Excluded by scope. |
| POST `/api/internal/calendars/sync` | Confirmed mutating | Privileged calendar status/event/block synchronization writes. |
| GET `/api/calendars/[filename]` | Verified read-only | Checked-in token export RPCs are STABLE SELECT; no session persistence/refresh. Live RPC bodies unknown; sensitive token route excluded from smoke allowlist. |
| POST `/admin/media/upload` | Confirmed mutating | Storage upload, media_assets insert, cleanup remove. |
| POST `/admin/content/homepage/hero-upload` | Confirmed mutating | Signed upload initiation, asset row insert/status updates, storage processing and cleanup. |
| GET `/admin/preview` | Potentially mutating | Auth session read plus draftMode.enable cookie mutation and redirect. |
| GET `/admin/preview/exit` | Confirmed mutating | draftMode.disable changes local cookie, redirects to admin; not a database write itself. |
| GET `/robots.txt`, `/sitemap.xml` | Verified read-only | Public SEO/content SELECTs in source; clean request only. |
| GET `/_next/static/*`, local public assets | Verified read-only | Local static files; no database code. |
| GET `/_next/image` | Potentially mutating | Can fetch remote configured images; dynamic source/remote effects unverified. Excluded. |
| Live production RPC definitions, RLS policies, external schedulers | Unknown | No production connection or infrastructure inspection performed. |

All admin Server Action POSTs are Confirmed mutating where they call save/status/archive/publish/reorder/mark-read/sync operations. Redirect-only legacy admin pages still pass through the auth-aware proxy. Methods not exported by handlers are not approved test targets.

## Mutation inventory and GET-side effects

- Booking hold RPCs insert bookings, guest details, items, packages/reservations and reference counters. `create_booking_hold` calls `expire_booking_holds`, which UPDATEs held bookings to cancelled; dependent triggers update inventory and booking items. Multi-room/package/admin booking functions call related booking logic. Confirmation UPDATEs status and can enqueue owner notifications via database triggers even with local email configuration disabled.
- Cancellation is an admin booking status UPDATE, with reservation/item status triggers and after-response notification dispatch. Notes/manual bookings also write. None are safe production tests.
- Contact POST invokes submit_contact_inquiry and inserts database data with public credentials. Blank privileged secrets do not make this safe.
- Room/admin inventory saving invokes sync_room_inventory; writes room types/physical rooms, images, amenities, rates, SEO and link tables. Availability blocks insert/archive records. Rate/season/rule operations insert/update/delete linking rows. Do not submit these forms.
- CMS edits affect documents/drafts, homepage sections/highlights/reviews, navigation, galleries/footer, languages/translations, experiences, transfers, articles/categories, property publication/settings and SEO. Replacement lists often DELETE then INSERT. SQL lifecycle/SEO triggers can also update timestamps or insert redirects.
- Media and hero operations insert/update metadata, obtain signed upload URLs, upload original/processed images, update processing status, and remove files during cleanup. Storage writes must remain disabled.
- NotificationBell clicking a notification or Mark all read UPDATEs notifications directly from the browser. Server notification actions also UPDATE rows. Realtime subscriptions read events but introduce authenticated session behavior. Notification dispatch uses Resend and UPDATEs delivery logs on success/failure; no autonomous startup dispatch found.
- iCal import updates calendar sync status, downloads external feeds, calls sync_external_calendar_events (upserts/archives events and availability blocks via triggers), and writes errors on failure. Manual admin sync and internal POST are prohibited. No checked-in automatic timer or Netlify scheduled function found; externally configured schedules are UNKNOWN.
- GET proxy language selection performs SELECT and sets a local language cookie. Admin GET auth.getUser and cookie-aware SSR calls can refresh expired sessions. Browser auth clients can detect callback tokens and exchange/refresh sessions. No standalone application auth callback route was found. Avoid cookies, auth URLs, query tokens and admin entirely.
- Public preview query parameters can authorize an admin session and read unpublished material. Do not include preview or draft cookies.
- Headers use useBookingRoutePrefetch to prefetch /book after 2.5 seconds. BookingFlow autoSearch with valid dates issues POST /api/pricing without submitting the booking form. ExperienceBookingFlow fetches GET availability on mount/date changes. These make browser navigation broader than a single HTTP GET, even though checked-in availability SQL is read-only. No booking creation on ordinary public page mount was found; confirmation handlers require explicit action.
- Checked-in available_room_count only SELECTs and ignores expired holds by timestamp; it does not call expire_booking_holds. calculate_room_stay_price is STABLE and computes SELECT-derived prices. get_public_experience_slots is STABLE SELECT. get_booking_confirmation_package and both export RPCs are STABLE SELECT. Source is not evidence that production has identical definitions. No RPC will be called during preparation.

### Direct mutation call sites

Generated inventory of database/storage/auth mutation calls and RPC entry points; wrapper Server Actions are listed separately below. Used for navigation, not a substitute for the path analysis above.

| Source file | Calls |
| --- | --- |
| `src/app/admin/content/homepage/hero-upload/route.ts` | createSignedUploadUrl, insert, remove, update, upload |
| `src/app/admin/media/actions.ts` | update |
| `src/app/admin/media/upload/route.ts` | insert, remove, upload |
| `src/app/admin/rooms/actions.ts` | insert, update |
| `src/app/admin/settings/publication-actions.ts` | update |
| `src/app/api/admin/login/route.ts` | signInWithPassword, signOut |
| `src/app/api/bookings/confirm/route.ts` | rpc(confirm_booking_hold) |
| `src/app/api/bookings/experience/route.ts` | rpc(create_experience_booking_hold), rpc(get_public_experience_slots) |
| `src/app/api/bookings/hold/route.ts` | rpc(create_multi_room_booking_package_hold) |
| `src/app/api/calendars/[filename]/route.ts` | rpc(get_external_calendar_export_events), rpc(is_external_calendar_export_enabled) |
| `src/app/api/contact/route.ts` | rpc(submit_contact_inquiry) |
| `src/app/api/pricing/route.ts` | rpc(available_room_count), rpc(calculate_room_stay_price) |
| `src/app/book/experience/[slug]/page.tsx` | rpc(get_public_experience_slots) |
| `src/app/booking/confirmation/[token]/page.tsx` | rpc(get_booking_confirmation_package) |
| `src/components/admin/HeroImageFields.tsx` | uploadToSignedUrl |
| `src/components/admin/MediaUploader.tsx` | delete |
| `src/components/admin/NotificationBell.tsx` | update |
| `src/components/admin/RoomImagesManager.tsx` | insert, update |
| `src/hooks/useAuth.ts` | signInWithPassword, signOut, signUp |
| `src/lib/notifications/service.ts` | update |
| `src/lib/repositories/admin/amenities.ts` | insert, update |
| `src/lib/repositories/admin/availability.ts` | insert, update |
| `src/lib/repositories/admin/bookings.ts` | rpc(create_admin_booking), update |
| `src/lib/repositories/admin/channels.ts` | insert, update |
| `src/lib/repositories/admin/cms-pages.ts` | insert, update |
| `src/lib/repositories/admin/experiences.ts` | delete, insert, update, upsert |
| `src/lib/repositories/admin/explore.ts` | insert, update, upsert |
| `src/lib/repositories/admin/homepage.ts` | delete, insert, update, upsert |
| `src/lib/repositories/admin/inquiries.ts` | update |
| `src/lib/repositories/admin/languages.ts` | insert, update, upsert |
| `src/lib/repositories/admin/media.ts` | update |
| `src/lib/repositories/admin/notifications.ts` | update |
| `src/lib/repositories/admin/rates.ts` | delete, insert, update |
| `src/lib/repositories/admin/rooms.ts` | delete, insert, rpc(sync_room_inventory), update, upsert |
| `src/lib/repositories/admin/seo.ts` | update, upsert |
| `src/lib/repositories/admin/settings.ts` | update, upsert |
| `src/lib/repositories/admin/site-content.ts` | update, upsert |
| `src/lib/repositories/admin/transfers.ts` | delete, insert, update, upsert |
| `src/services/ical-sync.ts` | rpc(sync_external_calendar_events), update |

Server Action modules (confirmed write-capable; no invocation authorized):

- `src/app/admin/amenities/actions.ts`
- `src/app/admin/availability/actions.ts`
- `src/app/admin/bookings/actions.ts`
- `src/app/admin/channels/actions.ts`
- `src/app/admin/content/actions.ts`
- `src/app/admin/content/homepage/actions.ts`
- `src/app/admin/content/site-actions.ts`
- `src/app/admin/experiences/actions.ts`
- `src/app/admin/explore-koman/actions.ts`
- `src/app/admin/inquiries/actions.ts`
- `src/app/admin/languages/actions.ts`
- `src/app/admin/media/actions.ts`
- `src/app/admin/notifications/actions.ts`
- `src/app/admin/rates/actions.ts`
- `src/app/admin/rooms/actions.ts`
- `src/app/admin/seo/actions.ts`
- `src/app/admin/settings/actions.ts`
- `src/app/admin/settings/publication-actions.ts`
- `src/app/admin/transfers/actions.ts`

## Startup, build and local validation

package.json has no preinstall/postinstall/predev/prebuild migrations, seeds, scheduled sync or application initialization writes. next.config.ts derives an image hostname and local build options. No instrumentation startup hook found. Starting dev/start launches an HTTP server; incoming rendering and build prerendering can read Supabase once environment values exist. next/font/google also has external font dependencies. Client auth behavior and dynamic rendering mean an unrestricted running app is not a read-only environment.

Checks were run in the canonical clone with public Supabase URL/key and all integration secrets explicitly forced EMPTY in the child environment (overriding .env.local), telemetry disabled, and a temporary Node preload rejecting fetch/http/https and external socket connections. No production credentials were passed to validation. No code edits were made to pass checks. Temporary guard/log files live in /tmp and are not application source.

| Check | Result |
| --- | --- |
| npm run lint | PASS, exit 0 |
| npm test | PASS, 110/110, exit 0; module-type warning remains |
| npm run build | BLOCKED/FAIL, exit 1: network guard interferes with Turbopack worker IPC; not evidence of an application compilation defect |
| node_modules/.bin/tsc --noEmit | PASS, exit 0; existing generated Next types present |
| Website startup / HTTP / browser checks | NOT RUN against production; no authorization |

The first strict guard rejected local sockets. A retry allowed explicit loopback connections but the build still failed with the same worker error; no protection was removed. Font fetching may independently need network/cache. Prior setup had a successful build without Supabase credentials; this audit does not claim a successful strictly offline build. Failed build output can leave .next incomplete; do not use it as a production start artifact.

Safe recurring checks: npm run lint, npm test and local tsc only with production integration variables removed/empty and outbound networking blocked as above. Build should be rerun under an OS-level outbound-deny policy that permits build-worker loopback and local IPC, with no Supabase credentials. Plain npm run build/dev/start with the production .env.local must not be treated as offline. A durable offline workflow needs a separate local Supabase environment or mock data and, if needed, separately authorized application safeguards.

## GitHub and Netlify

Branch main; HEAD 745b4aa56589cda5e5d0c8823ccc1cabb055e313. Origin fetch/push URL: https://github.com/marlecisander-bit/borealis-guesthouse.git. HEAD versus cached origin/main is 0 ahead/0 behind; no fetch was performed during this audit, so live GitHub freshness is not independently confirmed. Before report creation only docs/NEW-MAC-SETUP-REPORT.md was untracked. This report adds another untracked file; tracked source and package-lock.json remain unchanged.

netlify.toml uses npm run build, publish .next and Node 20.19.5. Local Node is 24.21.0 (satisfies >=20.9 but differs from hosting). Next 16.3.4, React 19.2.8, npm 11.19.0, TypeScript 5.9.3. No checked-in GitHub workflows or local Netlify site binding found. Hosted site identity, production branch, remote env, auto-publishing settings, existing database schedulers and deployed revision are UNKNOWN. Repository default branch main is not proof of Netlify production branch.

Public rendering/build configuration uses NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and optionally NEXT_PUBLIC_SITE_URL. Optional notification links use APP_URL or NEXT_PUBLIC_APP_URL. Server-only optional integrations use service-role, Resend and iCal secrets; payment configuration checks STRIPE_SECRET_KEY/PAYMENT_PROVIDER_SECRET. These optional secrets were left empty locally, and none were read from Netlify. NEXT_PUBLIC values may be bundled at build time. Pushes may auto-deploy depending on remote settings; do not push to discover this.

## Candidates and blockers

Future approval can cover cookie-free, JavaScript-free GETs only to `/`, `/rooms`, `/experiences`, `/transfers`, `/explore-koman`, `/about`, `/contact`, `/gallery`, `/robots.txt` and `/sitemap.xml`, and specific published detail slugs. These are source-verified read-only request paths under those constraints. No form submissions, preview/lang parameters, browser prefetch or auth state. Direct public SELECT connectivity checks also require separate approval and a narrowly defined table/projection; do not substitute RPC calls.

Do not test `/admin/**`, `/api/**`, `/book/**`, `/booking/confirmation/**`, auth callbacks/session operations, or browser interaction flows against production. Calendar export is source-read-only but token scoped and deliberately outside the smoke scope. No blanket browser automation is approved.

Remaining blockers:

1. Separate explicit approval is required for any production-connected check, even a candidate GET. A public key is not a database write prohibition.
2. Public key validity/project association and live database definitions/policies remain unverified; no test request was made. Do not expose the key to obtain verification.
3. There is no development database. Full booking/admin/notification/storage development cannot be safely verified against the only production project under these restrictions.
4. Offline build is blocked by the current guard/worker interaction. Local typecheck passes but is not a substitute for a fresh complete build.
5. VS Code open-folder state and remote Netlify settings were not independently verified.

Next steps: confirm VS Code Explorer points to the canonical clone; enter the project's public key locally if still a placeholder; keep every privileged integration empty. Arrange a separate local/development Supabase instance or mocks before mutation testing. If desired, separately approve only the narrow cookie-free public GET scope above; approval will not extend to API, auth, bookings, synchronization, or browser automation. Inspect Netlify deployment settings read-only before any later publishing decision. No source changes are authorized by this report.

This report supersedes the earlier setup report on production identity and configuration status. It does not authorize execution of the earlier report's generic browser/auth/booking validation steps.
