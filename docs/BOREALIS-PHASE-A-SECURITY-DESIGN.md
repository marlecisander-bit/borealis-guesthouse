# Borealis Phase A — security remediation design

2026-10-21 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. **DESIGN ONLY — no SQL executed, no application changes, no deployment.**

**Design package complete. Production implementation: NO-GO pending isolated validation and fresh metadata.** This task prepares proposals only. It does not authorize or perform application implementation, SQL execution, policy/role changes, Storage operations, Git publication or deployment.

## Owner summary

- **F01:** keep existing documents/payloads in place, limit public and ordinary authenticated reads to published public columns, and route authorized editing/preview through two explicit member-checked RPCs. This avoids moving data or relying on a view to hide drafts.
- **F02:** remove public/direct user execution from exactly the reference-counter and hold-expiration helpers. Preserve approved public booking RPCs and trusted nested/server use.
- **F03:** replace legacy email-based media permissions with active owner/manager/editor property-scoped policies. Hero uploads also need an authenticated upload path and a verified signed-token drain; changing policies alone cannot prove immediate revocation of already-issued upload capabilities.

No customer/draft data was used. The local preview/build/launcher were neither changed nor restarted/stopped by this design task. The proposal does not broaden the read-only preview contract or admit private RPCs to it.

## Evidence and unresolved facts

Reviewed the four requested audit/matrix documents; current canonical CMS, Auth, media, hero, Supabase and booking call sites; migrations007/014/015/016/021/027/029/032/033/037/039 as relevant; recorded production columns/policies/function ACL/hash metadata. The production catalog is from2026-10-20 and is historical evidence for this2026-10-21 design, not a new live certification. No production SQL, including metadata SELECT, was executed in this task.

New relevant refinements: can_manage_site_content retains a legacy email definition in reviewed source; use the active-profile helper rather than trusting that name. Hero start currently mints a signed upload capability; the official SDK documents a two-hour lifetime without further authentication. Storage operation-aware helpers are documented, but their presence/behavior in the deployed service remains unknown. Neither missing owners/column ACLs/role inheritance nor service-version behavior is guessed.

## Design/report package

| Finding | Plan | Proposed SQL units | Compatibility requirement | Current production gate |
| --- | --- | --- | --- | --- |
| F01 | [Draft protection](BOREALIS-F01-DRAFT-PROTECTION-PLAN.md) | RPC expansion then privilege contraction | Admin document/status/save, preview and language document enumeration use private RPCs | Fresh exposure/ACL/owner inventory; isolated public/private tests; compatible app deployed first |
| F02 | [RPC permissions](BOREALIS-F02-RPC-PERMISSIONS-PLAN.md) | Exact two-function ACL transaction | No app patch expected if nested owners hold required permission | Prove owner chain and inherited privileges; public booking/expiry fixture tests |
| F03 | [Storage authorization](BOREALIS-F03-STORAGE-AUTH-PLAN.md) | Consolidated object/metadata policy transaction | Authenticated hero upload instead of signed upload; ordinary upload role gate | Equivalent Storage version/operations; token drain; legacy prefix compatibility; role/API tests |

Proposals are stored under `docs/security-proposals/phase-a/` with suffix `.sql.proposed`, outside migration discovery. They are exact review candidates, not executed or production-approved migration files. Their comments state prerequisites. Do not concatenate/run them or silently change suffixes. Assign actual migration versions and prepare a separately approved runner/preflight manifest only after tests pass.

## Shared isolated-test prerequisites

1. Independently identified non-production database/Auth/Storage service, matching PostgreSQL/Storage versions and reviewed schema baseline. Reject production project ref rlqyruulxyanfgvnzkpe, production URLs/keys and unverified target identities before opening a connection. Do not bootstrap by replaying all historical production migrations.
2. Synthetic properties A/B and accounts O/M/E/S/disabled/non-member/legacy-only, seeded through approved isolated tooling. No real account creation, copied JWTs, customer/draft payloads, private objects or role changes in production.
3. Fake mail/calendar/payment integrations, no production service/provider credentials, explicit network targets and bounded test cleanup. Existing RLS trigger side effects must not send real notifications.
4. Capture fixture/schema/source identities and baseline expected failures, then apply candidate units only in the isolated target. Run SQL permission assertions, direct PostgREST, authenticated application preview/save, and real isolated Storage service tests. Mocks alone do not prove role enforcement or signed-token behavior.
5. Archive exact pre/post definitions and normalized effective grants, outputs as status/counts and synthetic IDs; redact tokens/keys and payloads. Clear only owned synthetic fixtures, never production records.

[synthetic-denial-examples.sql.proposed](security-proposals/phase-a/synthetic-denial-examples.sql.proposed) provides exact SQL negative examples after fixture/target verification. It does not provision fixtures or claim complete coverage. Positive/negative/concurrency/API test matrices are specified in each plan. They have NOT RUN. This task's validation is source/metadata/document consistency review only; no SQL parser, PostgreSQL transaction or integration acceptance is claimed.

## Promotion ordering and shared safety gates

No one-click combined migration is recommended. F02 can be independent after its nested-owner tests. F01 uses expand→app compatibility→drain old authoring→contract; only contraction closes the exposure. F03 needs compatible authenticated upload support, a reviewed media-authoring window, service-side signing denial and capability/in-flight drain. Test individual units and their combined final state. Avoid changes to unrelated can_manage_* functions, admin memberships, buckets, RPC grants or deployment settings as incidental cleanup.

A future production promotion needs explicit owner authorization plus: fresh narrow metadata fingerprint; verified actual migration/ownership/role/exposure baseline; isolated tests and recovery drill; reviewed application diff; exact SQL diff; safe backup/definition capture; lock/timeout behavior; schema-cache reload verification; source-publication/deployment plan and rollback-compatible release. Unknown drift, unsupported helper, missing legacy-path plan, failing test or unverified token lifetime is NO-GO. Do not weaken the policy or restore broad grants merely to remove a service error.

Recovery favors forward fixes or paused authoring with published-read continuity. Restoring the old broad CMS/Storage/public-helper privileges reopens the findings and is not a safe automatic rollback. A transaction rollback cannot undo previous disclosure, object writes/CDN caching, minted tokens or externally sent messages. Production smoke checks must use approved public reads and metadata, not customer bookings or mutation probes.

## Decision record

| Gate | Result |
| --- | --- |
| Exact recorded objects/callers and minimal changes mapped | COMPLETE |
| Separate proposed SQL and synthetic validation contracts | PREPARED, NOT EXECUTED |
| Application compatibility changes | SPECIFIED, NOT IMPLEMENTED |
| Fresh production owners/ACL/inheritance/exposure/Storage version | NOT VERIFIED |
| Isolated SQL/API/role/Storage/token tests | NOT RUN |
| Production implementation/deployment | NO-GO; not authorized by this task |

Next authorization, if desired, is implementation and validation **only in an independently isolated synthetic test environment**, including the explicitly proposed application patch and candidate SQL. It must identify that target and allow its fixture accounts/media tests. Production application, publication/deployment, membership changes, providers and production data remain separately excluded unless explicitly approved later. There is no automatic next phase.

## Official references

Privilege combination/column grants: [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html). Definer owner/search-path considerations: [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html). Public bucket versus mutation access: [Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [access control](https://supabase.com/docs/guides/storage/security/access-control). Capability lifetime: [signed upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl). Operation-aware policy support: [Storage helpers](https://supabase.com/docs/guides/storage/schema/helper-functions), whose linked upstream operations are design references only until matched to the actual deployed release.
