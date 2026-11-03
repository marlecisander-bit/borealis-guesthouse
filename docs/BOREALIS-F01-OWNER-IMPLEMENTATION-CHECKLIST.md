# Borealis F01 — owner implementation checklist

21 October2026, Europe/Tirane. **Preparation only. Every production stage below is NOT STARTED.** This checklist records future boundaries; it does not request approval or authorize any operation today.

Offline checks pass:20 focused F01 cases,132 candidate tests,145 canonical tests, type/lint and a clean network-denied build. These are application/mock/build results, not database permission acceptance. See [the validation report](BOREALIS-F01-FINAL-OFFLINE-VALIDATION.md).

## Before any live stage

Have the exact existing project identity, reviewed SQL hashes and source-only release inventory recorded. Resolve the new offline SQL review findings: unexpected/default RPC grants must fail closed, and contraction needs exact before/after checks. Separate versioned proposals exist; the older files were not silently changed. No proposal has been parser/database-tested in this task.

Review the local-only backup/unverified-restore/off-Mac limits and backup age when future work is actually considered. Passing file decryption does not make recovery proven. No fresh production status has been checked in this offline task. Use only the existing infrastructure; a duplicate environment is not imposed by this checklist.

| Future stage — all NOT STARTED | Preconditions and expected result | Stop conditions | Recovery action | Separate approval requirement |
| --- | --- | --- | --- | --- |
| **1. F01-00/F01-01 expansion** |Reviewed immutable SQL version, fresh exact project/schema/owner/ACL/default-grant checks, current recovery decision. Ten keys and two correctly restricted private RPCs installed; rows/base public grants unchanged |Drift, wrong project, parser/review gap, lock/statement failure, extra grant, name collision or ambiguous commit |Rollback uncommitted unit; inspect ambiguous outcome; retain accepted additive key expansion if later unit fails; reviewed forward fix only |Specific expansion and operation-specific recovery-risk decision, at a future owner-selected time |
| **2. Authorized live testing** |Accepted expansion; approved synthetic identities, properties, draft-only documents, fake/disabled integrations and cleanup scope. Prove real anon/nonmember/staff/disabled/cross-property denial and O/M/E access |Unexpected private bytes, wrong actor/property, side effects, leftover fixture or mismatch between SQL and REST |Stop tests; preserve evidence; clean only approved fixtures; pause affected authoring and forward-fix |Explicit fixture/Auth/CMS/RPC test and cleanup scope; none is granted by expansion alone |
| **3. Compatible application release** |Accepted live tests and exact source-only candidate; successful build; no preview flags/private files; reviewed existing hosting environment. Record the actual deployed compatible commit and verify public continuity/private no-store |Wrong publish set, failed build/deploy, public errors, direct-table/service fallback or shared private cache |Keep/restore only a tested RPC-compatible release or forward-fix; no full database restore |Explicit GitHub/main/Netlify publication/deployment scope; a main push auto-publishes |
| **4. CMS authoring maintenance** |Compatible app accepted; agreed quiet window and method to pause authoring. Drain old editors, requests and stale clients while published pages remain available |Old callers/requests remain, pause cannot be demonstrated or public continuity fails |Keep affected authoring paused; investigate; do not force the next stage |Explicit maintenance scope/window; no real account revocation or unrelated settings change implied |
| **5. F01-02 contraction** |Accepted app/tests/drain, reviewed exact guarded contraction and fresh grants/exposures. Only five published public columns readable; direct ordinary-user writes unavailable |Any failed precondition/assertion, remaining broad table/column/inherited grant, unexpected policy or ambiguous commit |Rollback uncommitted change; independently inspect; retain narrow boundary and forward-fix or keep authoring paused |Separate exact F01-02 approval; expansion/release approval does not include it |
| **6. Post-change security acceptance** |Approved synthetic and zero-row/limit0 REST checks. Prove anonymous/non-admin draft/wildcard/alias denial, authorized editing/preview and publication cache behavior; preserve F02 and public pages |Any private leakage, wrong role/property, unexpected mutation/cache, public breakage or unverified cleanup |Stop promotion; keep authoring paused; narrow reviewed repair; reopen only after acceptance |Separate live verification/write-test/cleanup/reopening scope; no real content used for a negative test |

## Rules that make the existing-project test plan safe

- Committed synthetic CMS rows must remain draft-only. Current public CMS readers are not consistently property-filtered, so published synthetic rows can disrupt public output. Test publish/merge in reviewed rollback-only transactions; a separate HTTP session cannot see those uncommitted fixtures.
- Do not read real unpublished or guest data to demonstrate denial. After contraction, metadata and zero-row REST checks can verify column permissions without fetching private values. Real JWT/private read tests use only approved synthetic documents.
- Check trigger/provider effects before any rollback-only test; rollback alone does not guarantee no external side effect. No real booking, email, calendar or payment operation is an incidental test.
- No automatic retries. If COMMIT outcome is ambiguous, inspect read-only metadata before deciding anything.
- Never restore broad anonymous draft grants, public F02 helper execution or a pre-RPC app after contraction. A compatible rollback must identify an accepted deployed RPC-compatible commit; none has been deployed by this preparation.
- A full restore, image upload, credential change or new infrastructure is not an automatic recovery step. It needs its own reviewed incident decision.

## Current owner-facing conclusion

The code and build are ready for further **offline review**. Production F01 is not complete: expansion alone leaves the existing table exposure open, and mock tests cannot certify real PostgreSQL authorization. The next useful non-mutating step is reviewing the separate SQL-hardening proposals and their exact expected metadata. Stop here; no approval is being requested and no live stage will run automatically.
