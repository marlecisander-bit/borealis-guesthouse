# Borealis security and integrations audit

2026-10-20 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Audit only; no fixes or deployment.

**Overall: FAIL for a complete production security/readiness certification.** The restricted local preview boundary passes the checks performed; it does not repair production RLS/grants. F01 is the leading production confidentiality finding. There is no claim of an observed exploit, leaked guest data or an account compromise. No write-capable endpoint/function was invoked.

## Evidence boundary

Used earlier same-day production metadata in `.local/production-sync-audit/catalog.json`, `detail-with-source-hashes.json` and migration reconciliation evidence, plus current source. New production reads were limited to public robots/sitemap and read-only GitHub revision metadata; no new SQL/guest queries. Current anonymous/role behavior was inferred only where catalog grants/policies and function bodies establish it; no impersonation/exploitation test was attempted. Sensitive cached content and browser stores were not inspected. Credentials were never printed. Existing local runtime configuration was validated privately by public-key fingerprint and credential-name presence/absence, not copied into reports.

## Database assessment

| Area | Recorded fact / source | Assessment |
| --- | --- | --- |
| RLS coverage | All 60 recorded public tables have RLS=true, FORCE=false | PASS for enabled flag only. RLS existence is not policy correctness; owners/definers can bypass it intentionally |
| Columns / reader schema | 907 recorded columns; mechanical comparison of 883 literal root select-field occurrences found zero missing columns | PASS for that bounded comparison; dynamic selects, nested relation inference, writes/types and runtime data NOT fully certified |
| Relationships/constraints | 372 constraints; PK/FK/checks and room-reservation exclusion visible | Positive schema evidence; complete secondary-index coverage/query plans NOT TESTED |
| Policies/grants |115 policies and 1,240 table grants, including broad anon grants on some RLS tables | Evaluate policy plus privilege together. INSERT/UPDATE grant does not by itself bypass RLS; TRUNCATE is outside row policies but is not a standard PostgREST table mutation endpoint |
| Draft publishing | Published cms_documents row admits anonymous whole-table SELECT while draft_data remains on same row | FAIL F01; no actual draft read performed |
| Private operations | Guest/booking/payment/notification/admin relations are not public CMS readers/preview projections | Positive application boundary; full direct-role negative tests NOT TESTED |
| Internal writers | next_booking_reference and expire_booking_holds have public executable privileges | FAIL/least-privilege problem F02; next reference increments without caller check |
| Administrative RPCs | create_admin_booking and sync_external_calendar_events contain internal active role/service checks | Positive source control. An anon EXECUTE ACL alone is not proof of unauthorized booking/sync |
| Definer resolution |44 application functions have explicit recorded search_path=public; signature/body hash evidence retained | Better than an implicit search path. Schema CREATE privileges, function owner trust and complete overload/grant behavior still need isolated verification |
| Booking integrity | Live recorded GiST room-overlap exclusion and status/occupancy checks; source locks/triggers | PARTIAL; see booking audit. No concurrent database execution |
| Storage | public-media is public,10 MiB bucket limit, JPEG/PNG/WebP/AVIF metadata | Public image access intended; write-policy drift F03. No bucket listing/private-object read/upload |
| Realtime | NotificationBell subscribes to property notifications INSERT; SQL 031 adds publication entry | Implemented but current publication/role delivery NOT TESTED; no claim WebSocket delivery worked |
| Migration history |41 repository migrations; no standard Supabase schema_migrations ledger in recorded catalog; only realtime ledger relation seen | NOT reconciled. Matching 44 function bodies is not proof all migrations applied or safe replay order |
| Backups/restore | No restore drill or backup retention evidence reviewed | NOT TESTED; production recovery cannot be assumed |

### Why F01 is material

The current editor intentionally preserves published data A while saving unpublished B in draft_data on the same row. The recorded public policy admits the whole row when status=published, and anonymous SELECT is granted at table level. A public application projection selecting only id,data is an implementation convention; it cannot prevent a different anonymous client from requesting draft_data. The local preview's frozen select contract similarly does not constrain an outside client using the public production endpoint. The appropriate correction must protect the database exposure itself, with authenticated authoring still functional. Neither real draft values nor evidence of exploitation were collected.

### Authorization model and drift

`getCurrentAdmin` validates the Supabase user via getUser, then the earliest active admin_profiles membership and one of owner/manager/editor/staff. `requireAdmin`/role wrappers run in actions and protected server pages. Admin login verifies that an active profile exists after password sign-in and signs out unauthorized accounts. Frontend sidebar visibility is not authorization. Some roles see links that later reject; that is an owner UX question, not by itself a server bypass.

Storage and legacy media policies instead use an admin_users email match. They do not automatically inherit current profile revocation/role/property-prefix checks. Because permissive policies combine with OR, adding a stricter current policy does not restrict an existing broader policy. No account membership data was fetched, so the existence of a currently affected user remains unknown. This needs a policy reconciliation, not profile copying or blanket service-role uploads.

The general upload handler initially checks that a session exists; action-level role controls and database/Storage RLS must still agree. It validates type signatures and size, sanitizes filenames and uses a property-prefixed UUID path. Hero upload independently requires the expected role and processes raster output. Client-submitted dimensions in the general upload are metadata, not a proof of decoded pixels; malformed-image/resource-limit handling needs isolated adversarial fixtures. No live upload was sent.

## Integration inventory

| Integration | Configuration / call path | Status | Verification / gap |
| --- | --- | --- | --- |
| Supabase public CMS | NEXT_PUBLIC_SUPABASE_URL + public publishable key, anonymous no-session transport,5-minute tags | Active; bounded reads verified locally | Seven routes 200; expected field provenance/completeness and full upstream trace not collected |
| Supabase Auth/password admin | SSR cookies + getUser + active membership | Configured; runtime NOT TESTED | Earlier metadata: email signup allowed, confirmation on, external providers disabled. Existing profile sign-ins were not reused |
| Auth redirect/recovery | Earlier Site URL localhost:3000, no redirect URLs | Configured but deployment readiness unresolved | Historical control-plane record, not a fresh current assertion; configure production/dev origins separately only with approval |
| Supabase browser client | Authenticated admin notification reads/updates and subscription | Implemented; preview refuses construction | Live authenticated role/session tests NOT TESTED |
| Service-role operations | Server-only client used for delivery/batch calendar sync | Missing local configuration intentionally | Key absent in isolated preview; no privileged client created there; production secret readiness not established |
| Storage/public images | public-media + exact asset references | Active bounded public images; write workflow PARTIAL | v7 earlier anonymous 9 exact image GETs 200 with raster MIME/signatures; no current browser-photo acceptance; F03/F07 |
| Next image processing | next/image remotePatterns, Sharp hero/general preparation | Implemented; unit/build PASS | General optimizer blocked in preview, exact direct v7 image paths allowed; normal production path not newly visual-tested |
| Manrope / Cormorant Garamond | next/font/local, repository TTF + OFL/provenance manifests | Active and verified loading | Fresh local GETs 200,164700/1195560 bytes match seals; no Google Fonts download needed |
| Owner in-app notifications | DB trigger → notifications; bell/list/read actions | Implemented, live event NOT TESTED | Unit/template/source checks; reads distinct from provider delivery |
| Resend owner mail | after callback → NotificationService → api.resend.com/emails | Implemented but inactive locally; production unverified | Requires service role + Resend key/from, correct APP_URL and domain/recipient setup; no send. Claim/retry defect F09 |
| Guest confirmation email | Stored guest_confirmation_enabled | Missing delivery backend | Public confirmation page is not an email sender; F08 |
| iCal export | Validated token filename → two public read RPCs → ICS builder | Implemented but NOT TESTED live | Never opened real secret export token; token is a capability and should not be logged/published |
| iCal import | Owner manual action or protected batch endpoint → HTTPS downloader/parser/sync RPC | Partially implemented; disabled/unverified locally | No real feed contacted; DNS/stream-bound issues F11; automatic scheduler not evidenced F10 |
| Booking.com/Airbnb | External calendar provider labels and iCal URLs | iCal only | No direct channel-manager/payment/OTA booking API implementation found; do not promise bidirectional real-time channel management |
| Payment provider | STRIPE_SECRET_KEY/PAYMENT_PROVIDER_SECRET presence indicator + settings | Implemented but inactive settings only | No payment SDK checkout/webhook/refund flow; payments table existence is not processing readiness |
| Google Maps | Approved Google URL/short URL resolver and embed construction | Implemented; preview intentionally blocks frames/network | Google map unit tests PASS; new browser rendering not accepted; user-triggered provider privacy/performance review pending |
| SEO/robots/sitemap | DB metadata + NEXT_PUBLIC_SITE_URL | Active with confirmed defect | Fresh production robots/sitemap advertise localhost F16; route/slug/noindex gaps F17 |
| Analytics | No SDK/tag consumer found | Not applicable/not implemented in inspected source | Hosting analytics/control-plane features not inspected; no tracking request was introduced |
| Scheduled jobs | Internal calendar endpoint; possible documented external schedule | Not established | No repository Netlify scheduled function, cron or delivery worker found; remote schedules NOT freshly inventoried |
| GitHub/Netlify | Main linked auto-publishing in earlier metadata | Configured; release NOT ready | Dirty/untracked/private tree F15, current hosting toggles not freshly verified, public SEO defect confirmed |

## Local preview controls: what passed

Current v7 policy retains exact 127.0.0.1:3000 authority, installed-Next normalization consistency checks, paired flags, isolated build config, no privileged integrations/deployment environment, fixed GET/HEAD page/static allowlist, session-header stripping, public Supabase select/filter constraints and no RPC/Auth/storage server transport. Browser client/service-role construction fails in preview; browser fetch/XHR/WebSocket/form/navigation restrictions supplement server policy. Current CSP includes connect-src self, form-action none, font-src self, frame-src none. Nine exact public image paths are the reviewed v7 exception; arbitrary external media and /_next/image remain denied.

Fresh audit: seven pages returned 200 with CSP/no-store/noindex, no Set-Cookie or redirect; both font responses matched sealed bytes.125 unit tests and 22 cache/ownership tests passed with networking denied. A new full build ran with OS deny network*. Actual recorded server PID 18704 listens only on 127.0.0.1:3000 and remains running. No real mutation dispatch was used for testing.

These checks do not prove absence of every native socket request, every upstream header, all browser extensions or every direct database API permission. No independent packet-level trace or isolated automated browser console/network capture exists. Preview restrictions must not be deployed as a substitute for production RLS, and the public key is public configuration rather than a read-only credential.

## Release and private-data hygiene

`.env*` is Git-ignored; service-role/Resend/payment/calendar secrets are absent in the reviewed local runtime. No credential rotation is justified by an unobserved leak. However `.local/` appears untracked rather than ignored and includes browser/runtime/evidence material. Do not stage it; F15 needs an explicit source-only publication review. Historical receipts and cache must remain private/preserved.

The requested compatibility pair is Node 20.19.5 + Next 16.3.4, not the system Node 24 merely satisfying engines. Node support alignment and current advisory checks remain F23. Separate project-level/branch/team environment controls matter: earlier deploy previews shared the production Supabase variables, so they are not an isolated mutation test backend. A frontend rollback cannot undo a security-policy migration or external send/sync.

## Safe next security verification

First create an independently approved isolated target with no production credentials, synthetic data, fake recipients/feeds and explicit role identities. Test anonymous/public/editor/staff/owner/disabled/cross-property direct table, RPC and Storage access. Prove draft columns cannot be requested; internal writers cannot be called directly; public booking entry points still validate; private guest/notification/payment relations remain inaccessible. Include definer signature/owner/search_path/schema grants, Realtime publication, token disclosure/expiry, body/traffic budgets, database backup restore and policy rollback compatibility. No production mutation test is required or authorized to demonstrate these issues.

Use [roadmap](BOREALIS-REMEDIATION-ROADMAP.md) for F01–F03,F08–F16,F22–F23 and the exact acceptance criteria. No fixes, native-host repairs, browser-profile inspection, SQL changes, sends, payments, uploads, syncs or deployments occurred.

## Complete application-function signature inventory

These 44 recorded functions include trigger helpers and older overloads, not 44 browser API calls. Each has recorded search_path=public and a prior body-hash reconciliation. Execution privileges, internal authorization and SQL semantics must be evaluated per signature; function existence or a grant is not a runtime PASS. No function was called against production in this audit.

| Function | Arguments |
| --- | --- |
| `apply_content_lifecycle_timestamps` | `(none)` |
| `available_room_count` | `target_property uuid, target_room_type uuid, stay_start date, stay_end date` |
| `calculate_room_stay_price` | `target_property uuid, target_room_type uuid, stay_start date, stay_end date, guest_count integer` |
| `can_manage_amenities` | `target_property uuid` |
| `can_manage_availability` | `target_property uuid` |
| `can_manage_experiences` | `target_property uuid` |
| `can_manage_homepage` | `target_property uuid` |
| `can_manage_property` | `target_property uuid, allowed_roles admin_role[]` |
| `can_manage_rates` | `target_property uuid` |
| `can_manage_site_content` | `target_property uuid` |
| `capture_page_seo_slug_change` | `(none)` |
| `confirm_booking_hold` | `target_booking uuid, target_token uuid` |
| `create_admin_booking` | `target_room_type uuid, stay_start date, stay_end date, adult_count integer, child_count integer, guest_data jsonb` |
| `create_admin_booking` | `target_room_type uuid, stay_start date, stay_end date, adult_count integer, child_count integer, infant_count integer, guest_data jsonb` |
| `create_booking_hold` | `target_room_type uuid, stay_start date, stay_end date, guest_count integer, guest_data jsonb, addon_data jsonb` |
| `create_booking_package_hold` | `target_room_type uuid, stay_start date, stay_end date, guest_count integer, guest_data jsonb, addon_data jsonb` |
| `create_experience_booking_hold` | `target_experience uuid, requested_date date, requested_time time without time zone, participant_count integer, guest_data jsonb` |
| `create_multi_room_booking_package_hold` | `room_data jsonb, stay_start date, stay_end date, guest_count integer, guest_data jsonb, addon_data jsonb` |
| `enqueue_booking_notification` | `(none)` |
| `enrich_experience_booking_notification` | `(none)` |
| `expire_booking_holds` | `target_property uuid` |
| `get_booking_confirmation` | `target_token uuid` |
| `get_booking_confirmation_package` | `target_token uuid` |
| `get_external_calendar_export_events` | `target_token text` |
| `get_public_experience_slots` | `target_experience uuid, from_date date` |
| `guard_availability_block_reservations` | `(none)` |
| `guard_booking_item_currency` | `(none)` |
| `guard_experience_booking_item` | `(none)` |
| `guard_room_reservation_availability` | `(none)` |
| `is_external_calendar_export_enabled` | `target_token text` |
| `is_property_admin` | `target_property uuid, allowed_roles text[]` |
| `is_room_available` | `target_room uuid, stay_start date, stay_end date` |
| `lock_property_inventory` | `(none)` |
| `mirror_external_calendar_event` | `(none)` |
| `next_booking_reference` | `target_property uuid` |
| `refresh_external_calendar_blocks` | `(none)` |
| `set_updated_at` | `(none)` |
| `submit_contact_inquiry` | `sender_name text, sender_email text, sender_phone text, inquiry_subject text, inquiry_message text` |
| `sync_booking_item_status` | `(none)` |
| `sync_booking_reservation_status` | `(none)` |
| `sync_external_calendar_events` | `target_calendar uuid, event_payload jsonb` |
| `sync_room_inventory` | `target_room_type uuid, target_count integer, actor uuid` |
| `validate_external_calendar_target` | `(none)` |
| `validate_room_occupancy` | `target_room_type uuid, adult_count integer, child_count integer, infant_count integer` |
