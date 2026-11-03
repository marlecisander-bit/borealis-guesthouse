# Borealis isolated local development plan

Inspection date: 2026-10-19 (Europe/Tirane). Canonical clone: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Read both production-safe and final readiness reports. This is inspection and planning only: no installation, container/database startup, SQL execution, migration application, local user creation, font download or application source change occurred. Production project `rlqyruulxyanfgvnzkpe` was not contacted. Existing production `.env.local` is untouched.

## Tool and workspace readiness

| Item | Finding |
| --- | --- |
| Project | Canonical Git clone; main; HEAD 745b4aa56589cda5e5d0c8823ccc1cabb055e313 |
| VS Code | Supplied active file is in the canonical clone. Open-folder root still cannot be independently confirmed; previous code --status/native inspection was unavailable. Confirm Explorer root manually. |
| CPU | Apple silicon, arm64 |
| Docker | docker command absent from PATH; /Applications/Docker.app absent. Daemon availability cannot be checked without a client. |
| Other runtimes | Common OrbStack/Rancher/Podman app paths absent; not an exhaustive machine inventory. |
| Supabase CLI | supabase command absent from PATH and common Homebrew/local binary paths. No project CLI dependency or supabase/config.toml found. |
| Homebrew | brew not available on PATH or the standard Apple silicon binary path checked. Do not assume it exists. |
| Node/npm | Previously verified Node 24.21.0, npm 11.19.0; meets CLI npm runtime minimum Node 20. Hosting Node remains different. |
| Git | No tracked changes observed; three existing setup reports untracked before this report. No fetch, push or commit. |

Install an approved Docker-compatible runtime and a pinned stable Supabase CLI only after approval. Docker Desktop is the requested default; Docker-compatible alternatives can be chosen explicitly. Prefer an official pinned standalone CLI to avoid changing application dependencies; alternatively approve a pinned dev dependency and its package/lockfile changes. Do not use DATABASE_SETUP.md's npm global installation or remote link/db push instructions. Current official guidance uses a project package install or supported system package installation. [CLI installation](https://supabase.com/docs/guides/local-development/cli/getting-started).

## Database compatibility findings

There are 41 migration files under database/migrations, plus the legacy schema, storage/CMS helpers, admin bootstrap and SQL scenario tests. They are not a drop-in verified Supabase CLI migration history.

1. **Version collisions:** filenames use YYYYMMDD_NNN_description.sql. CLI migration version is the initial numeric timestamp, so every group sharing the date collides: 20260902 (8), 20260903 (11), 20260904 (8), 20260905 (7), 20260910 (3), 20260912 (3). The single 20260911 file is distinct. Simply copying all originals into supabase/migrations is not safe.
2. **Repeated descriptive sequence labels:** 006 is used by homepage CMS and later room-rate activation; 037 is used by public/admin content sync and multi-room booking. Preserve chronological filename order, not NNN alone. Activation explicitly depends on rate management 004. Multi-room 037 must precede occupancy 038; experience 032 precedes replacement 033.
3. **Required baseline:** database/schema.sql creates legacy tables without IF NOT EXISTS, so replaying it into an existing schema fails. Migration 001 explicitly requires that baseline. It adds canonical enums, tables, columns, authorization and RLS. A generic Postgres container alone is insufficient: auth.users, auth.uid/auth.jwt, anon/authenticated/service_role roles and storage schemas/functions must come from a real local Supabase stack.
4. **Helper ordering:** media-storage.sql depends on the legacy media table, adds media columns and creates public-media plus storage policies. cms-foundation.sql explicitly depends on schema and media-storage; it adds legacy CMS columns and email-based admin authorization. Later migration 016 introduces canonical profile authorization. Determine whether each legacy helper is necessary by inspecting final consumers, column types and surviving policy names; do not blindly load both helpers and every canonical policy. If retained, order baseline → media storage → legacy CMS foundation → canonical 001 onward, then audit/remove conflicting legacy policies only in local copies after approval.
5. **Production-specific data migrations:** 034 family room and 035 triple room select a fixed existing property UUID and raise an exception if absent. They cannot replay on an empty database. Exclude their local copies from the schema replay and reproduce equivalent synthetic room fixtures later. Do not manufacture a production identity or copy production records merely to satisfy them. Their SQL scenario tests also need a fixture review before reuse.
6. **Interleaved schema and data:** 028 promotes configured properties; 037 public content sync backfills documents for existing properties. Empty-schema replay can skip their data effects, so the final synthetic seed must explicitly supply published property/CMS state. 036 normalizes amenity values. Schema replay alone does not create a usable public catalog.
7. **Dependency chain:** baseline → canonical 001 → rooms/amenities/rates/availability and homepage/site CMS → later products/SEO/translations/settings/workflow/storage boundaries → normalization/media → booking 021 → frontend readiness 022 → iCal 023 → currency/inventory 024–025 → public CMS 026 → booking engine/packages/cancellation/notifications 027–031 → experiences 032–033 → remaining normalization/content/multi-room/occupancy/hero work. This is a static candidate order, not a successfully tested replay.
8. **Platform compatibility:** verify local Postgres/extensions (uuid-ossp, gen_random_uuid and any required indexes), RLS roles, storage helpers and Realtime publication. Migration 031 conditionally adds notifications to supabase_realtime. Review constraint/function signature replacements across later files; preserve transaction boundaries, stop on first error, and never silence a failure with blanket IF NOT EXISTS edits.
9. **Unsafe generic helpers:** setup-first-admin.sql contains a hardcoded personal email and creates/promotes the live-style property. Do not reuse it. SQL tests intentionally write and some use service-role claims; rollback does not make them appropriate for production.

No SQL was executed. Full migration compatibility remains blocked until an authorized disposable local replay and schema assertions succeed. No production dump, migration-history pull or remote introspection is needed or authorized.

### Proposed local replay manifest

Create reviewed local copies with unique 14-digit versions and a provenance/hash manifest, leaving database/* unchanged. First copy/adapt baseline and only justified helpers, then the following chronological originals. Rows 034/035 are seed-only exclusions. Revisions to local SQL require approval. No automatic conversion was performed.

- `20260902_001_admin_cms_public_schema.sql`
- `20260902_002_rooms_management.sql`
- `20260902_003_amenities_manager.sql`
- `20260902_004_rate_management.sql`
- `20260902_005_availability_management.sql`
- `20260902_006_homepage_cms.sql`
- `20260902_007_site_content_cms.sql`
- `20260902_008_experiences_admin.sql`
- `20260903_006_room_rate_activation.sql`
- `20260903_009_transfers_admin.sql`
- `20260903_010_explore_koman_cms.sql`
- `20260903_011_central_seo.sql`
- `20260903_012_languages_translations.sql`
- `20260903_013_property_settings.sql`
- `20260903_014_content_workflow.sql`
- `20260903_015_storage_property_boundaries.sql`
- `20260903_016_cms_core_normalization.sql`
- `20260903_017_media_library.sql`
- `20260903_018_rooms_amenities_normalization.sql`
- `20260904_019_cms_page_seo.sql`
- `20260904_020_multilingual_architecture.sql`
- `20260904_021_booking_management.sql`
- `20260904_022_frontend_readiness.sql`
- `20260904_023_ical_channel_sync.sql`
- `20260904_024_currency_defaults.sql`
- `20260904_025_unified_rooms_inventory.sql`
- `20260904_026_public_page_content_cms.sql`
- `20260905_027_booking_engine_completion.sql`
- `20260905_028_booking_readiness.sql`
- `20260905_029_booking_packages.sql`
- `20260905_030_booking_cancellation_release.sql`
- `20260905_031_owner_notifications.sql`
- `20260905_032_standalone_experience_booking.sql`
- `20260905_033_experience_schedule_and_capacity.sql`
- `20260910_034_family_room_lake_view.sql` — exclude from schema replay; replace with synthetic seed.
- `20260910_035_triple_room_lake_view.sql` — exclude from schema replay; replace with synthetic seed.
- `20260910_036_amenity_icon_normalization.sql`
- `20260911_037_public_admin_content_sync.sql`
- `20260912_037_multi_room_booking.sql`
- `20260912_038_room_occupancy_policy.sql`
- `20260912_039_homepage_hero_assets.sql`

## Local-only initialization procedure — not executed

1. Approve/install runtime and pinned CLI; verify docker version/info, resource availability, image architecture, free ports and CLI help locally. Container image downloads require network access but no Supabase login or hosted project. Treat infrastructure download provisioning separately from isolated app/database execution.
2. Create an unlinked local CLI workspace, proposed `.local/borealis-supabase`, with its own ignore rules, config.toml, local project identifier `borealis-local-only`, reviewed migrations and seed. It must never contain a production link, token or production project identifier as its project_id. Original SQL remains untouched. The directory is only proposed, not created.
3. Run `supabase init` in that workspace only after approval. Disable automatic migration replay and seed in config until the manifest is approved; verify the chosen CLI version supports those configuration options before starting. Review generated config before any start because start can replay migrations/seeds. No login/link/db pull/db push/--linked/remote database URL commands.
4. Configure distinct local API/DB/Studio ports after checking collisions. Proposed defaults: API http://127.0.0.1:54321, Postgres 54322, Studio 54323; actual config/output is authoritative. Restrict published ports to loopback and verify Docker's bindings; do not assume the CLI does so. Disable external identity providers, SMTP delivery, Edge Functions/schedulers and external integrations. Auth mail must remain local capture only.
5. Start the empty local platform only after approval for image pulls and resource use. Capture local credentials into an ignored, owner-readable file without displaying CLI status/start secrets in task logs. Suppress/capture sensitive output rather than printing it. Do not reuse any production credential.
6. Confirm the active local database endpoint and project/container identity before SQL. Apply only the approved local copies; assert schema/table/column/RPC/RLS/storage prerequisites between dependency stages. Use ON_ERROR_STOP or equivalent. Explicitly local CLI migration commands are preferable to ambiguous defaults; verify --local support with the installed version. No reset until local volume identity and data-loss approval are confirmed.
7. Load synthetic seed only after complete schema replay. Verify anonymous public reads and local-only mutation scenarios. Rebuild from a second clean disposable local volume to demonstrate reproducibility; reset deletes local data and requires approval.

Official workflow: [local initialization and migration replay](https://supabase.com/docs/guides/local-development/cli-workflows). The documented seed phase follows migrations; do not rely on final seed data to satisfy an earlier hardcoded property migration.

## Synthetic seed strategy

Prepare a reviewed local-only seed.sql; none is executed or created as executable SQL during this planning task. Use deterministic UUIDs in a new local namespace, a fixture marker, explicit columns and reserved example.invalid email addresses. No customer exports, production UUID reuse, real email/phone recipients, live feed URLs or imported storage objects.

| Fixture | Proposed data / checks |
| --- | --- |
| Property | One published Borealis Local Test property, Europe/Tirane, EUR, localhost site/contact links |
| Rooms | Synthetic double (capacity 2), family (capacity 5), and triple (capacity 3); published types and physical units with matching occupancy/inventory counts |
| Rates | EUR 70/120/90 test base rates; one non-overlapping seasonal override and minimum-stay rule |
| Availability | Open units plus one explicit local closure on relative future dates; use dates derived from CURRENT_DATE to avoid stale fixtures |
| Bookings | One held, one confirmed and one cancelled synthetic package on distinct dates; use local domain RPCs to generate coherent guests/items/reservations/reference counters and test expiry/cancellation triggers |
| CMS | Published documents, navigation, homepage sections, property settings, default language/translations, page/global SEO, gallery and review fixtures |
| Media | Repository placeholder assets or synthetic local images in local public-media only; property-prefixed paths; no remote production images |
| Experience/transfer | One synthetic experience/slot and one transfer with capacity/pricing suitable for add-on tests |
| Admin | Optional local-only auth user/profile created through local Auth API after separate approval; owner@example.invalid; no actual owner identity |

Seed must explicitly fill data otherwise backfilled before any property existed, including documents and SEO. Keep notification recipients disabled, service role unset in the app, and email/iCal integrations off. Booking triggers may create local notification rows; inspect locally without sending mail. Use a separate opt-in scenario suite for mutation testing after its fixture assumptions are updated. Acceptance: public pages load local data, all application URLs/asset paths are local, capacity/pricing are coherent, local RLS applies, and no runtime egress is possible. [Seed guidance](https://supabase.com/docs/guides/local-development/seeding-your-database).

## Environment isolation strategy

Do not replace production `.env.local`. Proposed separate ignored file: `.env.borealis-local`, chmod 600, containing only local credentials. It is a design/template here; no real local credentials exist until the stack starts. Preserve production config and never source it in the local launcher.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=LOCAL_PUBLIC_KEY_FROM_LOCAL_STACK
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
APP_URL=http://127.0.0.1:3000
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
STRIPE_SECRET_KEY=
PAYMENT_PROVIDER_SECRET=
ICAL_SYNC_SECRET=
NEXT_DIST_DIR=.next-borealis-local
NEXT_TELEMETRY_DISABLED=1
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
```

Additional isolation: PERF_ORIGIN must be loopback if used; PERF_FETCH_LOG must be a local path; unset SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD, PGHOST/PGSERVICE/DATABASE_URL and inherited cloud credentials in CLI/app children even though the current app does not read all of them. Verify runtime endpoint variables and any future integrations against an allowlist.

A future approved local launcher must:

- Start from a minimal environment and parse the separate file without evaluating shell content. Explicitly export every supported URL/key/integration variable, including blank secrets, so Next cannot fill omissions from production .env.local. Next automatically reads .env.local; a differently named file or `dotenv -e ...` alone is not a sufficient guarantee.
- Fail closed unless every app/API origin is exactly approved numeric loopback with expected ports, the key is a local public key, privileged keys are blank, and no inherited endpoint/token can override the result. For legacy JWTs, verify local issuer/project claims as available; never trust format alone. Reject hosted Supabase domains and production reference anywhere in effective settings.
- Use `.next-borealis-local` exclusively for dev/build/start so stale production bundles are never reused. Browser public vars are embedded at build time; restart/rebuild after changes.
- Apply proven OS outbound-deny rules allowing only necessary local ports/Unix IPC to the app and browser, and container egress restrictions for the database stack. A host process sandbox does not restrict Docker VM/container or browser traffic automatically. Audit Docker bindings and container network behavior independently.
- Preflight local worker communication and external deny enforcement before startup. The previous audit demonstrated OS sandbox loopback/IPv4/IPv6 isolation for a build; preserve those protections, adapting allowed ports for the local stack.
- Use a clean browser profile without production cookies, service workers or saved auth state. Verify asset/CMS URLs, and do not import remote feeds. Provide no route that falls back to a production host.

No runnable safe-start launcher exists yet; this is a blocker, not an invitation to start with plain npm run dev.

## Google Fonts and offline build

src/app/layout.tsx uses next/font/google for Manrope and Cormorant Garamond (weights 400/500/600). No WOFF/WOFF2/TTF/OTF assets were found under public. Installed Next docs explain that Google fonts download during compilation and are self-hosted afterward. The fresh OS-isolated build reached that download and failed; it did not require production data.

Recommended reliable solution: after approval, obtain licensed Latin WOFF2 assets for the existing families/weights from an official distribution, retain license files and checksums, place them in repository font assets, and change only font loading to next/font/local while preserving CSS variable names/weights/display behavior. This is an application source change and needs separate authorization. Then rebuild under unchanged outbound denial. A system-font fallback requires a visual/source change too. Cache warming is less reproducible and is not a dependable offline solution; do not use an outbound exception merely to pass the isolated build.

## Future commands and approval gates

These are planned steps, NOT executed and NOT safe to paste before their prerequisites are implemented/reviewed:

```bash
# After installing the approved tools:
docker version
docker info
supabase --version
# After creating/reviewing the isolated CLI workspace/config:
cd '/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse/.local/borealis-supabase'
supabase init
# Only after disabling automatic replay/seed and reviewing ports/egress:
supabase start
```

After approved schema/seed and the fail-closed launcher are ready, that launcher—not the ordinary shell—must execute these commands with the validated local environment and OS isolation:

```bash
npm run lint
npm test
./node_modules/.bin/tsc --noEmit
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

The build/start environment must consistently use the isolated dist directory. Browser tests are a later local-only step after verifying effective endpoints and runtime egress. Do not use plain npm run start on previous production/failed build output. No website or database is started by this plan.

### Exact actions requiring approval

1. Install a chosen Docker-compatible runtime and pinned Supabase CLI; download container images and allocate local resources. No install was performed.
2. Create the local CLI workspace/config, reviewed uniquely versioned migration copies, local seed and ignored local environment file/launcher. Any corrections or policy changes in derived SQL need review; originals remain unchanged.
3. Start the isolated stack, apply the reviewed local schema, create local synthetic data/auth users, and run local mutation tests. Explicitly approve any subsequent local database reset/deletion.
4. Download font files and change the layout to local font loading. No source changes are authorized by this plan.
5. Run the isolated app/build/browser validation after endpoint, artifact, network and seed checks pass. No production testing is included.

Recommended next approval: tool installation and preparation of reviewed local configuration/migration copies, without starting the stack or applying SQL until that concrete result is reviewed. Production login/link/reset/pull/push/migrations, credentials access, data copying, Netlify changes and Git publication remain outside scope.

## Hardcoded-data and credential inspection limits

Static text scans across application/scripts/SQL/docs, excluding dependencies/Git/build caches and secret env files, found no hosted Supabase URL literal in src and no key-like JWT/publishable/secret literal in scanned project text. Hosted URL references were documentation examples/previous reports. This is pattern-based evidence, not a credential security audit. Production configuration remains in the preserved ignored .env.local and must be overridden/blocked as specified. SQL contains the fixed property identity in 034/035 and a personal email in setup-first-admin.sql; do not propagate those into fixtures. No credentials were printed.

Status: inspection complete; local database and safe runtime are not initialized. The principal blockers are absent tools, incompatible migration version naming/production data assumptions, no reviewed synthetic seed/launcher, and the font download dependency.
