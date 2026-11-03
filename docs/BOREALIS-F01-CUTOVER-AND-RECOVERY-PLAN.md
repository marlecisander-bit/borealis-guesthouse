# Borealis F01 — cutover and recovery plan

21 October2026, Europe/Tirane. **Planning only; no production change.** Existing project/repository/site only. F01-02 is explicitly excluded from execution in this task.

## Concise operation-specific recovery-risk record

**Scope:** only the proposed F01-00 key constraint expansion and F01-01 private RPC installation; later fixture writes, application deployment and privilege contraction are separate actions. **Owner acceptance: PENDING.** The implementation-preparation request explicitly says it is not blanket acceptance of unverified recovery.

**Available recovery material:** authenticated encrypted database/role snapshot from21 October at10:50:01 Europe/Tirane; CMS data/schema/functions/triggers/ACL/policy coverage;71 existing public image objects with verified bytes/checksums; exact before definitions and candidate/source identities. All files remain local and private; their key is accessible through this Mac's Keychain. No key was exported.

**Unavailable/unproven:** no successful restore drill; no independently verified off-Mac ciphertext or key recovery; no guaranteed recovery after losing this Mac/Keychain; no managed service/signing/provider/platform-encryption configuration bundle; role passwords omitted; three pending hero originals absent before backup. Content changes since the snapshot may not be recoverable from it. Media bytes and database snapshot are not a single atomic recovery point.

**How the backup would be used:** authenticate files with the recorded Keychain key, verify SHA-256 and inspect the TOC/SQL locally; compare against exact current project state; prepare a separately approved, narrowly scoped recovery diff. Media restoration requires explicit per-object version/conflict/CDN review and upload permission. Do not replay the role export or full archive blindly into populated production. No restore command is automatically triggered.

**Why restore remains unverified:** the owner prohibited duplicate environments and live restoration. Full parsing/decryption proves readable archive structure and byte integrity, not successful installation, privileged ownership, RLS behavior, extension/platform dependencies or application recovery.

**Migration failure consequences:** lock/contention or statement errors can roll back an individual bounded transaction and briefly delay CMS/public queries; a connection loss may leave commit outcome ambiguous and requires inspection. F01-00 can remain committed if F01-01 fails. A faulty committed function or incompatible release can interrupt editing/preview; recovery may require authoring suspension and a reviewed forward fix. Severe operator/platform failure or inability to use the local snapshot could cause loss of unsaved/newer content or prolonged interruption. Expansion leaves the existing confidentiality exposure open until later contraction. Do not promise zero downtime or complete disaster recovery.

Suggested explicit acceptance, for owner review only: “I accept these documented residual local-backup/unverified-restore risks specifically for the reviewed F01-00 and F01-01 expansion operations on rlqyruulxyanfgvnzkpe. This does not approve fixture/account/data writes, deployment, F01-02 or a live restore.” Acceptance alone does not waive failed build/SQL/runtime gates or authorize execution of a different hash.

## Controlled sequence after all separate approvals

1. Resolve the minimal release candidate's font/build gate and refresh target/schema/backup-age checks. Obtain explicit risk acceptance and approval of the exact guarded F01-00/01 files. No automatic execution follows preparation.
2. Apply approved expansion one transaction at a time; independently verify constraints, function identity/body/owner/search_path and effective/inherited grants. Confirm PostgREST discovery; never probe a real save to check availability.
3. Obtain separate fixture permission: unique synthetic property/document IDs, approved temporary identities/roles where needed, bounded cleanup and isolated provider side effects on this same project. Test active O/M/E, staff/disabled/nonmember/legacy-only, cross-property, validation, merge/publish atomicity and failure behavior using synthetic sentinels only. Mocks are not SQL/JWT acceptance. No such fixture was created here.
4. Approve and deploy only the reviewed, successfully built RPC-compatible source set through the existing main/Netlify path. Keep preview flags absent. Verify deployed commit, seven public-page continuity and approved private paths; do not infer deployment success from a local build.
5. Pause CMS authoring and drain in-flight requests, old editor sessions and stale client bundles before contraction. If necessary start maintenance earlier during testing/release. Define an operator, start/end conditions, bounded observation period and user refresh guidance; no fixed duration is guaranteed. Preserve public published reads.
6. Obtain separate approval for exact F01-02 after all previous evidence passes. Apply only the reviewed table AND column privilege contraction and published-only policy. Old private callers must no longer be active. Expansion by itself has not remedied F01.
7. Verify direct anonymous/non-admin authenticated draft/wildcard/alias/embed/expression reads are denied; draft-only/archived rows stay private; published approved columns stay readable; authorized property-scoped RPC editing/preview still works; direct ordinary-user writes fail. Verify real private no-store and publication-only public-cache invalidation using approved synthetic records. Recheck alternate exposures/inherited grants and F02. Clean only approved fixtures and verify cleanup.
8. Reopen authoring only after public/private/cache acceptance. If a security check fails, stop promotion and keep authoring paused where needed. Never restore broad anonymous/authenticated draft grants or public F02 helper execution to make a check pass.

## Forward fix and recovery boundaries

Before a transaction commits, fail/rollback and verify state. After a successful F01-00, do not remove book/global content to reverse the constraint. After RPC installation, retain compatible functions/releases while investigating narrow faults. After contraction, an old direct-table application cannot be the fallback; use a tested RPC-compatible release or pause authoring. Preserve public published reads and prepare an approved forward fix.

A full database restore or Storage upload is a separately authorized incident operation. Permission changes cannot recall already copied/cached draft material. Do not automatically replay insecure old definitions/grants, rotate credentials, reset users or modify unrelated booking/Storage policies. Any ambiguous outcome stops blind retry and requires independent read-only verification.

## Decision and exact next authorization

**NO-GO for production execution now.** The owner must separately accept the operation-specific recovery record and approve the named guarded expansion hashes after resolving the identified candidate-build/validation gates. Temporary synthetic records/accounts, compatible release/deployment, F01-02 and any recovery write are not included in expansion approval. No new environment is required or created; no current service is paused by this plan.
