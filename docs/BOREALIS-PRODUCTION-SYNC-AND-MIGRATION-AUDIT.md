# Borealis production synchronization and migration audit

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Production project `rlqyruulxyanfgvnzkpe`.

**Source synchronization PASS. Production metadata audit completed with bounded compatibility findings; local startup and any release remain blocked pending the local public-key correction and reviewed startup controls. No production migration is presently justified.** No separate DEV project was created. No production data/schema/settings were changed, no application started, and no Git publication or Netlify deployment occurred.

## GitHub synchronization and workspace

Read-only `git ls-remote origin refs/heads/main` returned `745b4aa56589cda5e5d0c8823ccc1cabb055e313`, identical to local HEAD and existing origin/main. This retrieved live GitHub ref metadata without running fetch or modifying local Git refs, index or working files. Origin is https://github.com/marlecisander-bit/borealis-guesthouse.git. No pull, checkout, merge or push was needed.

Canonical clone has no tracked modifications. Existing untracked reports and .local preparation artifacts remain preserved; do not add .local broadly. A byte comparison of every canonical tracked file against `/Users/aleksandermarleci/Desktop/Projects Dev/borealis-guesthouse-main` found zero differences. This does not claim that untracked dotenv, dependencies, diagnostic directories or build output are identical; those were not copied or reconciled.

Supplied IDE active-file path is canonical, but this agent's environment root remains the old snapshot. A direct VS Code UI check was blocked by pending computer-use permissions; no editor workspace switch was made. Before future coding/startup, open the canonical clone explicitly and verify Source Control shows that root. All repository commands in this audit used the canonical directory explicitly. Preserve both directories until workspace selection is settled.

## Production metadata scope and evidence

Used the existing authenticated Dashboard for the exact production project. Two bounded SQL batches ran inside BEGIN READ ONLY, with a local 10-second statement timeout and COMMIT. Queries read catalog metadata, information_schema, policy/grant metadata and bucket configuration only. No application table rows, guests, bookings, Auth users, storage objects, credentials, or write-capable application functions were queried. No EXPLAIN ANALYZE or mutation tests ran. The Dashboard editor held an audit query draft; no Save action was requested. Platform query/activity logging is expected and is distinct from modifying application data.

Private catalog evidence is under `.local/production-sync-audit`, mode600 files with a directory-local ignore rule: catalog.json, detail-with-source-hashes.json and migration-reconciliation.json. Persisted evidence uses function-source hashes rather than function bodies. The temporary comparison inputs remain private under /private/tmp. No credentials are in the report or audit evidence.

| Catalog area | Verified observation | Limit |
| --- | --- | --- |
| Public relations | 60 public relations in the queried table/partition/view categories | Not a complete ownership/type/index verification |
| Columns | 907 public columns inventoried | Presence alone does not establish constraints/default equivalence |
| RLS | All 60 inventoried relations report RLS enabled; force-RLS false | Owners/service-role may bypass; enablement is not proof of policy correctness |
| Policies | 115 total across public/storage; SELECT50, INSERT4, UPDATE6, DELETE2, ALL53 | Catalog inspection, no impersonated role or row-access testing |
| Grants | anon/authenticated/service_role table grants captured | No authenticated user or service-role test performed |
| Constraints | 372 public constraints inventoried | No writes used to exercise them |
| Triggers | 65 non-internal triggers across 41 tables | Definitions inspected without executing them |
| Functions | 232 public functions including extension functions; 44 non-extension application functions | Body checks described below; not a full semantic proof |
| Storage | public-media is public, 10MiB file limit, JPEG/PNG/WebP/AVIF | No object listing or upload/download tests |
| Storage policies | Authenticated admin upload/update/delete policies present | Public bucket reads are governed by public-bucket behavior; no blanket write permission inferred |
| Migration history | supabase_migrations.schema_migrations absent; only realtime.schema_migrations found in the non-auth/storage migration-table discovery | Realtime's table is platform history, not Borealis history |

No policy had a literal catalog expression exactly equal to true in the simple check. This does not exclude logically broad expressions, helper flaws, overlapping permissive policies or column-level exposure. Policies/ACLs and function search_path settings were captured; all 44 non-extension functions had non-null configuration. Those facts do not replace a targeted security review.

## Schema and function compatibility

All 44 non-extension production function bodies match at least one repository definition after whitespace normalization. Comparison preserved case, comments and non-whitespace text; it is a body comparison, not a proof of full CREATE FUNCTION identity, defaults, ownership, ACL, security mode or migration execution. Current signatures, security-definer/volatility and configuration metadata were captured separately. Historical versions that differ are often explicitly superseded by later migrations; do not replace a newer function with an older definition.

Latest matching definitions include available_room_count, calculate_room_stay_price, create_multi_room_booking_package_hold, confirm_booking_hold, get_booking_confirmation_package, validate_room_occupancy, both create_admin_booking overloads, experience availability/hold functions and calendar helpers. No application function was invoked. Static scans found no INSERT/UPDATE/DELETE/PERFORM tokens in the four inspected read-oriented bodies for availability, price, experience slots and confirmation-package retrieval; this narrow scan is not transitive purity analysis.

All 13 literal application RPC names were present. All actual literal application table references were present; a regex false positive named public came from Storage .from('public-media'), not a missing application table. Dynamic relation names, exact column/default/index/type equivalence and full RLS semantics remain outside that presence check. CMS, room inventory, rates, seasonal periods, pricing rules, availability blocks, bookings/items/reservations, experience availability and notification dependencies exist in catalog metadata.

## Migration reconciliation

No reliable Borealis ledger was found. Therefore **each migration is classified Unknown as a historical application event**, even when substantial current-object evidence matches. Unknown does not mean not applied. No migration is classified not applied, partially applied or incompatible merely because an older definition differs or history is absent. Function matches alone also cannot prove data transformations, backfills, policy changes and every statement executed.

| Repository migration | Classification | Supporting current-object evidence |
| --- | --- | --- |
| 20260902_001_admin_cms_public_schema.sql | Unknown | Matching function bodies: set_updated_at |
| 20260902_002_rooms_management.sql | Unknown | No complete execution proof from collected metadata |
| 20260902_003_amenities_manager.sql | Unknown | Matching function bodies: can_manage_amenities |
| 20260902_004_rate_management.sql | Unknown | Matching function bodies: can_manage_rates |
| 20260902_005_availability_management.sql | Unknown | Matching function bodies: can_manage_availability, is_room_available |
| 20260902_006_homepage_cms.sql | Unknown | Matching function bodies: can_manage_homepage |
| 20260902_007_site_content_cms.sql | Unknown | Matching function bodies: can_manage_site_content |
| 20260902_008_experiences_admin.sql | Unknown | Matching function bodies: can_manage_experiences |
| 20260903_006_room_rate_activation.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_009_transfers_admin.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_010_explore_koman_cms.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_011_central_seo.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_012_languages_translations.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_013_property_settings.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_014_content_workflow.sql | Unknown | Matching function bodies: apply_content_lifecycle_timestamps |
| 20260903_015_storage_property_boundaries.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_016_cms_core_normalization.sql | Unknown | Matching function bodies: can_manage_property |
| 20260903_017_media_library.sql | Unknown | No complete execution proof from collected metadata |
| 20260903_018_rooms_amenities_normalization.sql | Unknown | No complete execution proof from collected metadata |
| 20260904_019_cms_page_seo.sql | Unknown | Matching function bodies: capture_page_seo_slug_change |
| 20260904_020_multilingual_architecture.sql | Unknown | No complete execution proof from collected metadata |
| 20260904_021_booking_management.sql | Unknown | Matching function bodies: expire_booking_holds, available_room_count |
| 20260904_022_frontend_readiness.sql | Unknown | Matching function bodies: submit_contact_inquiry |
| 20260904_023_ical_channel_sync.sql | Unknown | Matching function bodies: validate_external_calendar_target, mirror_external_calendar_event, refresh_external_calendar_blocks, lock_property_inventory, guard_room_reservation_availability, sync_external_calendar_events, is_external_calendar_export_enabled, get_external_calendar_export_events |
| 20260904_024_currency_defaults.sql | Unknown | Matching function bodies: guard_booking_item_currency |
| 20260904_025_unified_rooms_inventory.sql | Unknown | Matching function bodies: sync_room_inventory |
| 20260904_026_public_page_content_cms.sql | Unknown | No complete execution proof from collected metadata |
| 20260905_027_booking_engine_completion.sql | Unknown | Matching function bodies: next_booking_reference, calculate_room_stay_price, create_booking_hold, get_booking_confirmation, guard_availability_block_reservations |
| 20260905_028_booking_readiness.sql | Unknown | No complete execution proof from collected metadata |
| 20260905_029_booking_packages.sql | Unknown | Matching function bodies: create_booking_package_hold |
| 20260905_030_booking_cancellation_release.sql | Unknown | Matching function bodies: sync_booking_reservation_status, sync_booking_item_status |
| 20260905_031_owner_notifications.sql | Unknown | Matching function bodies: enqueue_booking_notification |
| 20260905_032_standalone_experience_booking.sql | Unknown | No complete execution proof from collected metadata |
| 20260905_033_experience_schedule_and_capacity.sql | Unknown | Matching function bodies: guard_experience_booking_item, get_public_experience_slots, create_experience_booking_hold, enrich_experience_booking_notification |
| 20260910_034_family_room_lake_view.sql | Unknown | Production-specific data migration; data effect deliberately not inspected |
| 20260910_035_triple_room_lake_view.sql | Unknown | Production-specific data migration; data effect deliberately not inspected |
| 20260910_036_amenity_icon_normalization.sql | Unknown | No complete execution proof from collected metadata |
| 20260911_037_public_admin_content_sync.sql | Unknown | No complete execution proof from collected metadata |
| 20260912_037_multi_room_booking.sql | Unknown | No complete execution proof from collected metadata |
| 20260912_038_room_occupancy_policy.sql | Unknown | Matching function bodies: validate_room_occupancy, create_multi_room_booking_package_hold, confirm_booking_hold, get_booking_confirmation_package, create_admin_booking, create_admin_booking |
| 20260912_039_homepage_hero_assets.sql | Unknown | No complete execution proof from collected metadata |

The 44-row preparation manifest previously contained legacy schema/helpers plus these 41 files; a fresh reconstruction set is not appropriate for an existing populated production database. Its baseline and renamed review copies must not be replayed. Existing 034/035 production-property data must not be replaced with fictional fixtures. No data query was used to confirm their effect.

A trustworthy future reconciliation needs an object-by-object final desired-state specification including columns/types/defaults/enums/indexes/constraints/policies/ACLs and reviewed migration provenance. A missing ledger does not justify creating one with invented applied versions. Record a reviewed baseline only through a separately approved plan. Historical statement checksums, if unavailable, cannot be reconstructed from filenames.

## Exact proposed database changes

**None. No executable production change SQL is proposed by this audit.** Source migration to a new Mac does not inherently require database migration, and current deployed/source revisions already agree. The collected evidence establishes no necessary missing RPC or application table. A corrective migration would be speculative today.

Do not run schema.sql, migration repair, db reset, db push, production seed files, setup-first-admin.sql or the entire renamed review history. If a later approved task demonstrates a concrete mismatch, prepare one minimal transaction with exact preconditions, lock/statement timeouts, preserved dependent grants/policies, expected catalog changes, postconditions and an individually reviewed reversal/recovery plan. Review that artifact before execution.

## Local environment and production-write risks

The ignored canonical .env.local URL matches https://rlqyruulxyanfgvnzkpe.supabase.co. The configured public-key value is present but not a JWT or standard publishable-prefix value. One harmless GET to /auth/v1/settings using that key returned HTTP401; no response body was retained. Thus public-key validity FAILS the current check. Do not assume an invalid key is evidence of missing schema, and do not rotate server secrets or production JWT settings to fix a Mac configuration problem.

Proposed local-only correction: owner supplies the verified existing production **public/anon** key privately into ignored NEXT_PUBLIC_SUPABASE_ANON_KEY, then repeat only the settings metadata GET and record status without key/body. No key was retrieved from Netlify/Dashboard, copied to the report or changed here. Preserve the existing dotenv before editing; do not replace the production URL. An HTTP401 identifies authentication rejection, not its precise root cause.

SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, ICAL_SYNC_SECRET, STRIPE_SECRET_KEY and PAYMENT_PROVIDER_SECRET are blank. Site/app URL variables are set; exact origin alignment must be reviewed before startup. No service-role key should be added just to make local admin paths work.

| Route/path | Risk and required startup control |
| --- | --- |
| Public CMS GETs | Normal public-data reads; public-cms client disables session persistence/refresh. Its caching allowlist is not an outbound-write firewall: non-GET requests fall through to normal fetch |
| /api/pricing POST | Calls availability/price RPCs; not a booking mutation by its stated purpose, but POST must remain blocked until independently reviewed |
| /api/bookings/experience GET | Calls slot RPC; do not exercise against real records during this audit |
| Booking confirmation GET with token | Returns booking-specific data; prohibit during local read-only preview to avoid personal-data retrieval |
| /api/calendars/[filename] GET | Token-bearing calendar export may expose real booking information; block local access |
| Booking hold/confirm/experience POSTs | Create holds/guest/item/reservation records or confirm bookings; deny |
| /api/contact POST | Calls submit_contact_inquiry and writes a production inquiry; deny |
| /admin actions and uploads | CMS/settings/inventory/rate/availability/booking mutations and signed upload paths; deny all admin routes/server actions in read-only preview |
| Internal calendar-sync POST | Writes calendar status/events and fetches external feeds; absent secret currently rejects, but block route independently |
| Auth/browser/proxy | Browser/server Supabase clients can use sessions; proxy checks admin user and may refresh/set cookies. No production sign-in, sign-out, signup or existing session reuse in local preview |
| Build/start | Next build can prerender pages and read production data; font downloads are a separate external dependency. Do not run build assuming no network side effects |

Source review found no package install/start script that explicitly replays SQL. This is not a guarantee that arbitrary imports, future code or authenticated browser effects are read-only. No local server, production-connected page navigation or automated browser test was run.

## Controlled local startup requirements

Prepare a separate read-only launch mode before authorizing preview: canonical workspace explicitly selected, fresh build artifacts via NEXT_DIST_DIR, clean browser profile/no production auth cookies, loopback-only app listener, correct public key, blank privileged/integration credentials and exact production-host allowlist. Deny all mutation-capable server actions/routes locally and restrict outbound requests to reviewed public CMS GET paths; denying POST alone is insufficient because GETs can expose sensitive data and RPC semantics differ. A browser public key can still call production APIs outside local routing; launcher controls do not alter production authorization. Keep local users/host trust assumptions explicit.

No new guard was implemented or activated in this audit. Implementing it requires application-source review and installed Next16.3.4 documentation. Existing build/font issue and local Node24 versus Netlify's configured Node20.19.5 need a reproducible version/build decision. Prior lint/unit/type results are historical, not rerun production-connected validation. Only after a reviewed local guard and key correction may an explicitly authorized public-page smoke test run; never booking/admin/e2e mutation suites against production.

## Live Netlify release readiness

Read-only Dashboard verified site borealisguesthouse, Site ID4086f82d-2d8f-46af-9deb-679015b2cec1, production URL https://borealisguesthouse.netlify.app. Linked repository is github.com/marlecisander-bit/borealis-guesthouse. Production branch main; published revision745b4aa56589cda5e5d0c8823ccc1cabb055e313 matches local and GitHub. Consequently there is no source revision to deploy merely to finish the Mac move.

Auto publishing is ON; main deploys publish automatically. Branch deploys are limited to production branch; Deploy Previews are enabled for pull requests against production/branch-deploy branches. Both configured Supabase variables use the same value across deploy contexts. A preview is therefore not database isolation and can write production if its application permits it. Untrusted deploys require approval. All deployment methods can currently deploy to production. No setting was changed.

Live build config: Next.js runtime, base /, package directory unset, npm run build, publish .next, functions directory netlify/functions, build status Active, Ubuntu Noble24.04 build image. Repository netlify.toml sets NODE_VERSION20.19.5. No remote runtime-version execution was performed. Deploy logs are public; never log keys or guest data.

Only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY were listed as project environment variables; values were not expanded/read. No comparison with local key value was performed. Other source-read variables: SUPABASE_SERVICE_ROLE_KEY (server-only optional workflows), APP_URL/NEXT_PUBLIC_APP_URL/NEXT_PUBLIC_SITE_URL (site links/origins), RESEND_API_KEY/RESEND_FROM_EMAIL (real delivery), ICAL_SYNC_SECRET (calendar endpoint), STRIPE_SECRET_KEY/PAYMENT_PROVIDER_SECRET (payments). Do not add optional secrets without a concrete feature requirement. Absence from the project list does not establish absence of every team/system-injected value.

Dashboard also displayed a scheduled team downgrade in a month. It was not changed; owner should review its effect on deploy/security/retention before a future release. This is not an instruction to incur cost.

Evidence: [deploys](https://app.netlify.com/projects/borealisguesthouse/deploys), [developer settings](https://app.netlify.com/projects/borealisguesthouse/configuration/developer-settings), [environment names](https://app.netlify.com/projects/borealisguesthouse/configuration/env). No rebuild, deploy trigger, publish lock, environment edit or rollback action was invoked.

## Authentication and recovery limitations

Production Auth email is enabled, signups allowed, email confirmation enabled; anonymous sign-in and manual linking disabled. Listed external providers, including Google/GitHub/phone, are disabled. Auth Site URL is http://localhost:3000 with no redirect URLs configured. This is a real deployment-configuration concern for emailed links/redirect flows, but no Auth setting was changed. Before changing it, owner confirms intended public origin and exact login/recovery flows; prepare only the necessary production URL/redirect adjustment for individual review. Local inspection does not authorize Auth-email tests.

Netlify can republish a retained successful deploy, but future automatic main deployments can overwrite that rollback. An application rollback does not restore an external Supabase database. No database backup or restore was created or tested; production data export would need explicit private-data handling scope. Free-plan downloadable backup limitations mean recovery must not be assumed. [Netlify rollback guidance](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/), [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups).

The old Docker volumes are historical local platform resources, not production backups. Preserve all stopped custom/official resources; none were touched. No export, reset or cleanup is part of this audit. Destructive rollback SQL and broad schema replay are not recommended.

## Recommended execution sequence

1. Confirm canonical VS Code folder, preserve untracked work and keep the canceled DEV-creation form unused. No new project is needed.
2. Correct only the ignored local public key through a private owner-approved entry and verify settings GET succeeds. Do not request service-role credentials or change production keys.
3. Review proposed local read-only mode and font/runtime build preparation; authorize exact source changes if desired. Keep server actions, booking/contact/admin writes and real integrations disabled locally. Do not start automatically.
4. Individually review production Auth origin/redirect correction only if required by actual login/recovery flows. No schema change is currently recommended.
5. If a specific application feature later fails due to a verified catalog mismatch, complete its targeted metadata diff and prepare exact SQL and recovery evidence; approve that operation individually before execution. Do not repair fictional migration history.
6. After local startup controls and credential validation pass, separately authorize loopback-only public-page startup/smoke verification. No production mutation tests or personal-data pages.
7. There is currently no unpublished source revision. For any later change, review diff, build/tests, DB compatibility and recovery; request explicit publication approval before Git push because main auto-publishes. Netlify configuration edits or deployments remain separate operations.

**Decision: preserve the production database as-is. The Mac migration needs local environment/workspace readiness, not automatic database synchronization.** Historical migration provenance, exact complete schema equivalence, backup readiness, valid local public key and controlled startup remain the material limits. No production change has been executed.
