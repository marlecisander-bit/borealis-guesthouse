# Borealis Phase A — production promotion gates

2026-10-21 (Europe/Tirane). **NO-GO for production and NO-GO for test execution until target/baseline admission passes.** This is a preparation record, not an implementation approval. No production SQL or source change was performed.

## Evidence and pre-change definitions

The immutable proposal inputs are listed with SHA-256 in [source-lock.json](security-proposals/phase-a/validation/source-lock.json). [Recorded pre-change objects](security-proposals/phase-a/validation/recorded-prechange-objects.json) contains existing catalog policy/constraint/ACL/function-fingerprint evidence, not customer rows. Exact proposed transactions remain under `docs/security-proposals/phase-a/*.sql.proposed`; none was executed or rewritten.

| Finding | Exact object scope | Pre-change completeness gate |
| --- | --- | --- |
| F01 | `public.cms_documents`, its table and column privileges, `cms_documents_public` and admin policy, `can_manage_site_content(uuid)`, `can_manage_property(uuid,admin_role[])`; new `borealis_admin_cms_documents(uuid,text)` and `borealis_save_cms_document(uuid,text,jsonb,content_status)` | Record full table DDL/defaults/constraints, owners, all inherited/column ACLs, policies and dependent exposed views/functions; resolve eight-versus-ten document keys |
| F02 | `public.next_booking_reference(uuid)`, `public.expire_booking_holds(uuid)` and exact nested callers/owners | Record full definitions/owners/ACLs, overloads, role memberships and trusted call graph; current body fingerprints alone are not complete recovery definitions |
| F03 | Three legacy `storage.objects` write policies, media metadata legacy and current ALL policies, public read policy, hero policies/helpers; new membership/path helper | Record policy expressions/roles/permissiveness, grants/owners, all additional policies, bucket settings, platform operation context/version, aggregate legacy path coverage and capability lifetime |

Before applying anything, capture exact current CREATE definitions and ACLs privately as recovery evidence; compare with proposal expectations and stop on drift. Use no real content to demonstrate exposure. Do not install a proposal merely because an object name matches. Historical metadata is not a current production attestation.

## Required gates, in order

| Gate | Required evidence | Current state |
| --- | --- | --- |
| G01 Target | Independently identified DEV endpoint/reference, production mismatch, separate credentials, integrations disabled | BLOCKED: no admitted target |
| G02 Baseline | Platform/service versions, complete reconciled schema-only DDL, reviewed dependency order, fresh restore/fingerprint match | BLOCKED: missing metadata and CMS key decision |
| G03 Inputs | Proposal/application patch review, exact hashes, no unintended SQL/source/dependency changes | Proposals pinned; application compatibility not implemented |
| G04 Roles | Isolated anonymous/non-member/staff/disabled/editor/manager/owner/multi-property fixtures and inheritance checks | NOT RUN |
| G05 F01 | Complete matrix, public cache and private no-store behavior, zero anonymous/non-admin draft access through every exposed path | NOT RUN |
| G06 F02 | Direct REST/SQL denial, nested room/multi-room/experience success, expiration and reference uniqueness | NOT RUN |
| G07 F03 | Actual Storage API operations and object-byte checks, disable/cross-property denial, hero flow, legacy compatibility, token drain | NOT RUN |
| G08 Recovery | Isolated restore rehearsal and secure fail-closed recovery per finding | NOT RUN |
| G09 Release | Source-only reviewed publish set, no private `.local` material/secrets, production-backup and recovery approval, maintenance and compatibility plan | NOT APPROVED |
| G10 Promotion | Explicit owner authorization for exact application release and exact production SQL delta, followed by bounded verification | NOT AUTHORIZED |

No partial PASS promotes the whole phase. Unexpected success of a denied operation, missing object/helper, server-version drift, unsafe owner/grant, fixture contamination, unexpected provider request, unexpected policy or unexplained error is an immediate stop. Retain sanitized evidence; no automatic retries, broad grant fixes or service-key fallbacks.

## F01 transaction, compatibility and recovery

Apply expansion transaction only after verifying trusted owner/schema permissions and active-membership helper. Install authenticated-only, fixed-search-path private-read/save RPCs. Deploy reviewed call-site compatibility in admin site-content reads/save/status, preview reader and language enumeration; retain explicit public projections. Establish private RPC/application no-store behavior. Then apply contraction as its own transaction: remove broad table/column privileges, grant only approved public columns, replace the known policies with published-only read behavior and deny direct ordinary-user writes. Recheck anonymous explicit draft column, wildcard and nested exposures; require no secret bytes even in error payloads or caches.

Each proposal already defines a transaction; verify lock/statement timeouts and schema-cache notification semantics against the selected platform. Never combine a partially compatible app and contracted privileges without a tested maintenance plan. A lock timeout/failed statement must roll back the whole affected transaction; test it on isolated data.

During contraction old admin clients can fail until refreshed. Public explicit-column published reads should remain available, but wildcard readers and stale schema caches are compatibility risks. Pause authoring during cutover if needed. Recovery is forward repair or the already-tested RPC-compatible release with authoring paused. Keep prior definitions as evidence; do not automatically restore broad draft-reading privileges. Expansion rollback before dependency use may remove unused new RPCs only after dependency checks; contraction recovery must retain confidentiality. DB transaction rollback does not retract draft material previously cached elsewhere. No disclosure is asserted by this preparation.

## F02 transaction, compatibility and recovery

Revoke EXECUTE only on the two exact helper signatures from PUBLIC, anon and authenticated; preserve the intended explicit service role and effective trusted function owners. Do not revoke public booking RPCs indiscriminately. Before promotion prove every room/multi-room/experience nested path uses an owner that retains the required privilege, including trigger/expiration paths. Check inherited membership: revoking one direct grant does not remove an alternate grant path.

This is one bounded ACL transaction with no function-body change or intentional booking outage. A nested caller failure is NO-GO, not permission to regrant the helper to anonymous users. Repair only the reviewed trusted execution path or roll back the unpromoted application change; keep direct helpers denied. Isolated synthetic fixtures prove uniqueness/expiry and side effects. Do not run real bookings to validate production. ACL rollback cannot undo consumed references or expired holds; preserve evidence and avoid automatic counter edits.

## F03 transaction, compatibility and recovery

Review all effective policies first: permissive policies combine with OR, so an extra legacy branch defeats a stricter branch. Do not drop unexpected policies blindly. Prepare authenticated ordinary hero upload compatibility, explicit ordinary-upload O/M/E gate and checked cleanup without a service-role fallback. Test original/variant size and MIME handling; the recorded bucket limit is 10 MiB while hero UI offers 24 MiB. Resolve that mismatch deliberately; no silent bucket change.

Verify the actual Storage server version supports the exact operation helpers and context before applying the proposed policy transaction. Existing local image v1.82.1 source lists the relevant operation names, including signing, but that does not prove SQL helpers/context or production compatibility. See [official helpers](https://supabase.com/docs/guides/storage/schema/helper-functions) and [v1.82.1 operations](https://raw.githubusercontent.com/supabase/storage/v1.82.1/src/http/routes/operations.ts). Missing or unknown context must deny; never define a fake platform helper to make tests pass.

Cutover: approve media-authoring pause → deploy compatible authenticated upload flow → atomically replace the exact legacy Storage/metadata writer policies → prevent new signed capabilities at service boundary → drain previously issued capabilities/in-flight work → verify isolated security guarantee → reopen authoring after approved production promotion. Public bucket delivery remains unchanged. Staff/disabled/legacy-only access removal is intentional; do not copy real legacy memberships automatically.

[Signed upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) are documented as usable without further authentication and valid for two hours. Verify deployed lifetime and behavior; wait that maximum plus measured margin after issuance stops. Simulated time or SQL-only tests cannot prove token expiry. Existing tokens and authorized in-flight writes prevent a claim of immediate revocation. If an immediate guarantee is required, this design remains NO-GO pending a supported alternative. [Public bucket reads](https://supabase.com/docs/guides/storage/buckets/fundamentals) remain public intentionally; draft-media secrecy is outside this proposal.

Recovery preserves public image reads with media authoring paused, or forward-corrects the active-role/property policy and compatible app. Do not restore broad email-based policies or switch back to token-only clients after signing is denied. DB rollback cannot reverse object bytes, CDN copies, minted capabilities or completed uploads. Rehearse synthetic object recovery/compensating failures and retain original bytes privately. Legacy unprefixed objects require a separate compatibility decision; no automatic moves/deletes.

## Promotion evidence and decision

Keep per-case actor alias, target/version, input/proposal hash, channel, HTTP/SQL status, sanitized assertion result, before/after counts and synthetic byte hashes. Never store JWTs, passwords, signed URLs, draft bodies, authorization headers or real account/object identifiers in reports. Test evidence must distinguish SQL RLS, REST RPC, Storage HTTP, application cache and browser results. Every unrun case stays NOT RUN.

Production promotion additionally requires fresh schema/platform drift review, verified backup/recovery capability, ordered minimal migration and application diff, agreed maintenance/capability drain, source publication hygiene, and explicit owner approval. A successful isolated test does not authorize production deployment. Current decision: **GO for the prepared validation plan; NO-GO for execution or production until its gates and separate authorizations are satisfied.**
