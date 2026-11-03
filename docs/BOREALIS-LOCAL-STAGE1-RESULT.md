# Borealis local Stage 1 result

2026-10-19, Europe/Tirane. Work performed in `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`, following the local development plan. Production was not contacted. No containers, databases, migrations, seeds, booking tests, website, deployment or Git publication ran. Production .env.local and original database/application files were preserved.

## Tool results

### Supabase CLI — installed locally

Pinned stable version **2.121.0**, official `supabase/cli` GitHub release (prerelease=false). Downloaded `supabase_2.121.0_darwin_arm64.tar.gz` and official checksums.txt over HTTPS; SHA-256 matched before extracting the binary. `file` verifies Mach-O arm64; `--version` prints 2.121.0 on macOS 27.0.1 ARM64. Standalone Go executable does not depend on Node; installed Node 24.21.0 remains unchanged. No global PATH changes, Homebrew, npm dependencies or lockfile changes. No admin password, license acceptance or privileged helper needed.

Path: `.local/borealis-tools/bin/supabase`. Installer archive/checksums remain in `.local/borealis-tools/downloads`. Binary SHA-256: `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc`.

Official pinned source: https://github.com/supabase/cli/releases/tag/v2.121.0

### Docker Desktop — user handoff required

Docker command/Desktop app were absent at prior inspection; installation remains incomplete. Official Apple Silicon distribution and installation/permission documentation were verified. macOS is ARM64 and has 27.0.1 installed; Docker's current policy supports current/two prior major macOS releases, but an installed Docker release has not been validated on this host. Hardware resource readiness and daemon compatibility are not yet tested.

Official installation instructions require Docker Subscription Service Agreement acceptance. The owner explicitly requires interactive/license/admin steps to be completed manually. No installer was executed, Docker.app was not launched and no terms accepted. Docker version/daemon readiness therefore remain UNVERIFIED. No Homebrew installed.

Please download/install **Docker Desktop for Mac with Apple silicon** from [Docker's official page](https://docs.docker.com/desktop/setup/install/mac-install/), complete the agreement and any macOS approval/password prompts yourself, and report completion. Prefer user-directory CLI setup; do not enable privileged port helpers/default socket unless needed. Docker documentation explains CLI placement, optional privileged helpers and older installer permission choices: [Mac permission requirements](https://docs.docker.com/desktop/setup/install/mac-permission-requirements/). Do not run supabase start, containers, SQL or database initialization as part of this handoff. First launch can start Docker's engine; if strictly no engine launch is desired, install the app but leave first-run acceptance pending and tell me.

This handoff is required by your Stage 1 instruction to stop at license acceptance/admin/interactive approval; unaffected preparation was completed below.

## Local workspace/configuration

Created `.local/borealis-supabase/supabase/config.toml` using pinned CLI `init` under an OS deny-all-network policy and minimal environment. CLI init completed without login/link. Set project_id to `borealis-local-only`. Migrations/seed disabled, seed sql_paths empty; active migrations directory empty. Analytics, Edge runtime and local mail-capture service disabled. Generated external secret env lookups were blanked rather than inheriting cloud credentials. Auth redirect origins are localhost only; external providers retain disabled defaults.

Config remains a review artifact. Published Docker bindings, container egress, running service health and selected Postgres compatibility are not verified. No hosted project-ref/link was created. Starting the stack remains prohibited until Stage 2 approval.

`.local/.gitignore` ignores local tools/workspace contents while leaving that small ignore file visible for review. No root .gitignore edit. Both `.env.local` and `.env.borealis-local` match existing .env* rule. A new `.env.borealis-local` (mode 600) contains local endpoints and placeholder public key only; integration secrets empty. Real local credentials do not exist yet. No production credentials read into these generated files.

## Migration provenance and unresolved review

Manifest: `.local/borealis-supabase/migration-manifest.json`.

- 44 sources recorded: baseline, media storage helper, CMS foundation helper and 41 migrations.
- 42 byte-identical review copies with unique 14-digit versions in `review-migrations/`.
- 034/035 production-property seed migrations excluded; source hashes retained with null target and exclusion reason.
- Every source/target SHA-256 checked; unique versions and empty active migration directory asserted.
- Transformation is filename only; SQL semantics unchanged. No original database file edited.

Review copies intentionally reside OUTSIDE supabase/migrations. They must not automatically replay. Baseline → media-storage → cms-foundation → chronological migrations is a candidate review sequence, not approved executable order.

Unresolved: necessity of legacy helpers and broad surviving media/admin policies; legacy/canonical column types and constraints; FK/function/RLS order; local Postgres/auth/storage/Realtime prerequisites; backfills that assume a populated property; later function signature replacements. Excluded production seed effects need synthetic replacements. Review.md explains these gates. A disposable local replay is needed before claiming compatibility; no SQL has been run.

## Draft synthetic fixtures

`seed.draft.sql` contains fictional deterministic local property/type IDs, double/family/triple types, physical rooms, EUR 70/120/90 rates, a relative future closure, published CMS documents/navigation, local contact data, experience and transfer fixtures. No production identity, fixed production UUID, customer or media copied. Addresses use example.invalid.

`booking-scenarios.draft.sql` sketches held/confirmed/cancelled local booking fixtures through domain RPCs. Each draft begins a transaction, raises an unconditional review exception and ends in ROLLBACK. Neither is configured as automatic seed. Do not remove execution guards until local target/schema and Stage 2 approval are confirmed.

Draft completeness is limited: language/homepage/SEO, seasonal/minimum-stay fixtures, local media metadata, experience slots and post-booking assertions remain TODOs. SQL constraints/function signatures have not been runtime-validated. This is a reviewable draft, not a usable seeded database. Local admin/auth fixture creation is deferred.

## Launcher readiness

`launch-local.py` is a Stage 1 **check-only** fail-closed launcher. Checks local file permissions, duplicate/unknown/missing variables, exact loopback origins, hosted URL/production reference rejection, empty integrations and placeholder key. It reads only .env.borealis-local; never production .env.local. All runtime modes unconditionally stop before spawning anything. No marker/key edit bypasses the Stage 2 gate.

Verification: Python syntax parse passed; --check exits BLOCKED for unprovisioned local credentials; --mode dev exits BLOCKED without starting a process. Source migration hashes and application diff were verified. No live API requests used for checks.

`localhost-only.sb` provides the previously proven OS outbound-deny design permitting loopback/Unix worker communication. `LAUNCHER-DESIGN.md` specifies Stage 2 sterile runtime mirror, credential-minimal environment, no production .env loading, independent artifact directory, inherited OS policy and required local/external-deny preflight. It also requires independent browser/container egress controls: host sandbox alone does not cover them. Launcher execution implementation is intentionally deferred, so no safe runnable website command is claimed.

Google Fonts remains a separate blocker. No font downloads or layout changes occurred; approve licensed local font assets and next/font/local source changes separately.

## Exact Stage 2 blockers / proposed review

1. User completes Docker installation/license/permissions; verify CLI/daemon/ARM64 resources without starting a Supabase stack.
2. Review migration manifest and resolve legacy-helper/policy/type/order issues in derived copies, with explicit transformations/checksums; original SQL stays intact.
3. Approve local stack startup/image pulls, confirm only local container/project targets and loopback bindings, and enforce container/browser egress independently.
4. Approve local migration replay after review. Complete guarded seed TODOs and validate against the resulting local schema before any seed/booking scenarios.
5. Implement/review the sterile runtime launcher and provenance checks for local public key, then validate enforcement. Production config is never a fallback.
6. Separately approve offline-font assets/source changes before expecting a clean offline build.

No database reset is requested or approved. Any later reset requires explicit approval for identified local volumes. No production access is included in Stage 2 proposals.

## Rollback proposal — not executed

No global tools/settings were installed. To roll back, first ensure no later Stage 2 processes/data exist, then remove only the newly created `.local/borealis-tools`, `.local/borealis-supabase`, `.local/.gitignore`, `.env.borealis-local` and this report after reviewing them. Leave pre-existing reports, original database files and production .env.local untouched. There are no containers/volumes from this stage to delete. Do not use docker prune or broad directory deletion. Docker uninstall is unnecessary because this stage did not install it.

Final status: local CLI and Stage 1 preparation delivered; Docker handoff and the explicit Stage 2 review gates remain. No tracked application/database/dependency changes.
