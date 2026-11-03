# Borealis Phase A — isolated validation preparation

2026-10-21 (Europe/Tirane). Repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation complete; execution NO-GO.** No verified, running isolated target exists. No SQL was executed, services started, project created, application source changed or production data read for this task. The remediation architecture is unchanged. Proposed SQL remains inert and unexecuted.

## Recommended environment

Recommend one separate, temporary hosted Supabase DEV project, containing only synthetic data, after separate approval. It supplies PostgreSQL, Auth, PostgREST and Storage together and avoids the unresolved local CLI binding path. Prefer an existing target only after its independent identity, ownership, synthetic provenance and isolation are established; none is established in the available evidence. A hosted project is network-accessible, not a loopback sandbox: use restricted administrative access, separate secrets, no production data and no real provider integrations. No project has been selected or created.

| Candidate | Evidence assessed | Decision |
| --- | --- | --- |
| Existing official local CLI stack | CLI 2.121.0; nine existing containers, all stopped; PostgreSQL 17.11.0.004, Auth v2.197.0, PostgREST v16.4, Storage v1.82.1; separate existing DB/Storage volumes | Preserve; not a verified runnable target |
| Historical custom local stack | Five other Borealis containers, all stopped, separate historical network/volumes | Preserve; do not revive a second stack or assume its schema is correct |
| Supported explicit loopback publishing | Historical probe with explicit `127.0.0.1:port:port` succeeded; omitted-host probe published wildcard IPv4/IPv6 despite network default | Engine can express safe binding, but this is not a supported correction to the pinned CLI's invocation |
| Pinned CLI Docker start | Reviewed help/config exposes no explicit host-IP control; previous official startup bound wildcard | NO-GO without a separately reviewed supported binding solution; no shim, daemon change, firewall workaround or manual container edits |
| Current experimental native CLI stack | Official documentation describes native macOS ARM operation and experimental stack opt-in; default CLI help is not proof of absence | A possible future investigation, not a verified replacement. Requires pinned-version, host-process isolation, prerequisite and binding review; do not enable/install it here |
| Separate hosted DEV | Earlier preparation has null project reference/runtime URL and activation disabled | Recommended next provisioning scope; verify current plan capacity and $0 budget before creation |

Read-only Docker inspection found client/server 29.8.2 and fourteen stopped containers; no service mutation was issued. Empty stopped-container port maps do not prove safe future bindings. The existing local CLI configuration has API 55421, DB 55422, PostgreSQL major 17, migrations/seed disabled and loopback application URL. The pinned CLI binary SHA-256 is `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc`. Its help was inspected under OS network denial. No secrets/environment values from container inspection were displayed.

Supported options are described in [Supabase local development](https://supabase.com/docs/guides/local-development), [Docker and native runtimes](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes) and [separate environments](https://supabase.com/docs/guides/deployment/managing-environments). Current documentation does not establish the exact behavior of the pinned CLI or production Storage deployment. No CLI `start`, `stack prepare`, initialization or project linking was run.

## Target admission and credentials

Before any future connection or mutation, record the exact new DEV project reference, organization, region, PostgreSQL/platform versions and endpoint origin in a local allowlist. Independently compare the reference/origin against the recorded production identity and reject equality, missing identity, redirects or an unreviewed target. The harness must default to disabled and require an explicit synthetic-only execution authorization. Never infer DEV from a project name or environment-variable suffix.

Use a dedicated test worktree/application configuration with no inherited `.env.local`, production URL/key, deployment credentials, provider keys, calendar feeds or production service role. Provision DEV public/user/admin credentials separately; keep secrets outside reports and Git. Scope any DEV elevated fixture credential to setup/inspection only, never browser bundles or negative permission tests. An anonymous test must use the DEV public key with no user JWT; authenticated tests must use the corresponding synthetic user's JWT. Do not use service-role success as RLS evidence.

Disable external email/SMS/OAuth/provider activity; verify platform settings and isolate test identities before creating accounts. Use administrative creation of synthetic confirmed fixtures if approved, avoiding real recipient sends. No production Auth settings or real memberships are to be changed. Separate fixture administration from tested ordinary-user clients. Application startup and browser/admin E2E require a separately reviewed isolated application configuration; the current production-connected preview is not that environment.

## Reproducible baseline recipe

The package [baseline-recipe.json](security-proposals/phase-a/validation/baseline-recipe.json) records ordered stages and unresolved gates. It is a recipe, not an executable migration. Existing catalog evidence is useful but insufficient for a complete exact baseline: 60 public RLS-enabled tables, 907 columns, 372 constraints, 115 policies, 1,240 table grants, 65 triggers and 44 application-function fingerprints. The application migration ledger was not established. Historical source matching is not proof every migration was applied.

Required sequence:

1. Record a platform-owned empty DEV baseline: PostgreSQL version/extensions, platform schemas `auth`, `storage`, API schemas, roles `anon`, `authenticated`, `service_role`, trusted function owners and role inheritance/BYPASSRLS. Verify Auth JWT claims, `auth.uid()`/`auth.jwt()`, Storage helpers and PostgREST exposed schemas. Do not create hand-written substitutes for Supabase platform services or overwrite managed schema objects.
2. Reconcile application DDL from recorded metadata and final source definitions. Pin enum labels (`admin_role`, `content_status`, booking/payment/price types), extension schema placement and UUID defaults. Source references include uuid-ossp, btree_gist and pgcrypto; verify actual dependencies rather than installing blindly.
3. Prepare reviewed schema-only table definitions, defaults, identities/sequences and primary/unique keys for the application dependency closure. Include properties/admin profiles and legacy membership, CMS, media/hero, inventory/rates/settings, booking/reference counter/reservation and notification dependencies. Use the complete 60-table application schema where required by final functions/triggers, rather than an invented minimal booking model.
4. Resolve FK order, exclusion constraints and indexes; install final helper/function definitions in dependency order, then triggers, then exact RLS policies and ACLs. Fingerprint SECURITY DEFINER owners, search paths and EXECUTE grants. Deferred function-body checks do not validate runtime dependencies; do not suppress errors to force installation.
5. Capture an isolated pre-change catalog and compare to the reviewed expected contract. Add synthetic records only after schema review. Restore this synthetic baseline into another disposable target and compare fingerprints before calling the baseline reproducible.
6. Validate each proposed delta separately against that baseline: F01 expansion → compatible application → contraction; F02 helper ACL transaction; F03 compatible authenticated-upload application → policy transaction → capability drain. Preserve distinct pre/post checkpoints.

Do not replay all 41 historical migration files. `database/schema.sql` is older than the current schema; later migrations contain DML and environment assumptions. In particular, exclude production-specific room seed migrations 034/035, personal first-admin setup, production memberships, guest/draft/media rows, bucket objects and provider configuration. Extract only reviewed final DDL, not historical INSERT/UPDATE statements. No complete runnable baseline is claimed in this preparation.

### Material compatibility gate

Recorded `cms_documents_document_key_check` allows eight keys: rooms, experiences, transfers, explore-koman, about, gallery, contact, footer. The proposed F01 save RPC and current application contract additionally accept `book` and `global`; migration 037 contains a ten-key constraint and seed DML. Preserve the recorded eight-key baseline separately from the desired ten-key contract. On that baseline, saving the additional keys should expose the constraint failure; it must not be reported as successful F01 compatibility. Require a separately reviewed constraint-only delta or a narrowed contract decision. Do not silently replay migration 037 or copy its seed content. This is recorded evidence, not a new live schema query.

### Missing baseline evidence

Full live function DDL/owners, column-level ACLs, role inheritance/default privileges, enum labels, defaults/generated expressions, complete indexes, view/materialized-view exposure, extensions and platform Auth/Storage configuration are not fully captured. The 44 function body hashes identify recorded bodies but cannot reconstruct full CREATE FUNCTION definitions/owners. Source candidates and historical reconciliation remain inputs, not authoritative live DDL. Obtain missing schema-only metadata only in a separately authorized read-only inventory; no production SQL, including catalog SELECT, was run here. If that inventory is not authorized, the baseline remains blocked rather than fabricated.

## Validation package and execution boundaries

- [Synthetic test matrix](BOREALIS-PHASE-A-SYNTHETIC-TEST-MATRIX.md): actors, channels, before/after behavior, side-effect assertions and evidence.
- [Promotion gates](BOREALIS-PHASE-A-PRODUCTION-PROMOTION-GATES.md): transaction/cutover/recovery requirements.
- [Preparation package](security-proposals/phase-a/validation/README.md): SHA-256 source/proposal lock, recorded pre-change object definitions, baseline recipe, fixture contract, machine-readable test cases and disabled run-state template.

All cases are NOT RUN. No account, booking, draft or media fixture exists as a result of this task. SQL-only tests cannot establish Storage authorization, signed upload invalidation, CDN behavior or application cache behavior. Mocked tests cannot substitute for real isolated API tests. Prepare application patches only under later implementation authorization; this task changes no application source.

## Exact next authorization

Authorize provisioning and identity verification of **one independent hosted Supabase DEV project**, synthetic-only, within the previously prepared organization/region after current ownership/capacity verification, **maximum additional spend $0**. Abort on billing/upgrade requirements. No production cloning/branch data, GitHub linkage, SQL replay, fixtures, application startup or provider integration is included in that provisioning scope. Record the new project identity and separate credentials privately; do not display them.

After provisioning, separately authorize completion/review of the schema-only baseline and isolated compatibility implementation/test execution against that exact DEV reference. Missing production metadata and the CMS key constraint decision must be resolved first. This report grants neither authorization automatically. Production remains NO-GO.
