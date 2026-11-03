# Borealis F01 — expansion execution plan

21 October2026, Europe/Tirane. **Prepared only; no SQL mutation executed.** Target the existing `rlqyruulxyanfgvnzkpe` project. Production execution remains NO-GO until the risk/approval and validation gates in the [preflight result](BOREALIS-F01-PRODUCTION-PREFLIGHT-RESULT.md) are resolved.

## Exact review package

Original proposal files remain unchanged. Guarded candidates and exact unified diffs are separate:

- [F01-00 guarded SQL](security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed), [diff from original](security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed.diff). SHA-256 `52a520dc7f3d323ad8e4b037f6b8a36c61803233793866449a80dbc6cb2604ae`.
- [F01-01 guarded SQL](security-proposals/phase-a/controlled-expansion-v1/F01-01-cms-rpc-expand.sql.proposed), [diff from original](security-proposals/phase-a/controlled-expansion-v1/F01-01-cms-rpc-expand.sql.proposed.diff). SHA-256 `74128a10917c7f17fe0c1530655e058d8de0418fd682ce28af1031cd8783254a`.
- [Execution manifest](security-proposals/phase-a/controlled-expansion-v1/execution-manifest.json).
- Independent read-only [post-F01-00](security-proposals/phase-a/controlled-expansion-v1/post-F01-00-readonly-verification.sql) and [post-F01-01](security-proposals/phase-a/controlled-expansion-v1/post-F01-01-readonly-verification.sql) queries.

These remain `.sql.proposed` documents outside migration discovery. There is no auto-run launcher. Database name postgres is not a unique project identifier: verify the exact dashboard/project-bound connection before execution; the SQL role/database checks cannot replace that identity check.

## Fail-closed preconditions and boundaries

Each unit retains one BEGIN/COMMIT,3-second lock timeout and30-second statement timeout. Added DO guards bind the operation to the fresh exact CMS columns/defaults, constraints, policies, table/column ACLs/RLS/owner, lifecycle triggers, public/auth schema ACLs, full membership options, role security attributes, auth.uid body/owner/config/ACL, trusted helper definitions/owners/config/ACLs and F02 restrictions. RPC name collisions reject execution. Function body checks use MD5 for exact drift detection, not as a security signature. File SHA-256 identifies the reviewed package.

F01-00 expects the current eight-key constraint. F01-01 expects precisely the ten-key constraint produced by accepted F01-00 and otherwise unchanged metadata. Unexpected drift, timeout, name collision or postcondition failure means rollback/stop; no automatic retry, IF EXISTS masking, broad ACL repair or historical migration replay.

F01-00 only replaces the CHECK to admit rooms,experiences,transfers,explore-koman,about,gallery,contact,footer,book,global. It seeds/updates/deletes no content. A constraint/table lock and validation scan can briefly delay requests; no zero-interruption guarantee is made. Do not later narrow the key set by deleting new documents.

F01-01 installs exactly `borealis_admin_cms_documents(uuid,text)` and `borealis_save_cms_document(uuid,text,jsonb,public.content_status)`. Original RPC bodies are unchanged: postgres-owned SECURITY DEFINER, empty search_path, qualified references, auth.uid plus active O/M/E membership in the requested property; save validates key/object/status and owns the atomic draft/publish merge. Staff, disabled, nonmember and other-property callers are intended to fail. Actual enforcement remains untested until separately approved role/API tests run. No app service-role fallback is permitted.

Explicit function revokes remove PUBLIC/anon/authenticated/service_role execution before authenticated-only grants in the same transaction. The transaction checks trusted owner/definer/search_path and effective auth/postgres versus anon/service_role execution before COMMIT. Function creation installs a future writer; it does not invoke it. No existing row, booking, Storage object or unrelated permission is changed by expansion.

## Proposed order after separate approval

1. Verify package hashes, exact project/health/freshness and accepted recovery record. Recheck no drift since this snapshot and no outstanding incompatible authoring/release operation.
2. Apply only guarded F01-00. Run its independent READ ONLY postcheck; require exactly ten keys and unchanged F02 grants. Stop on mismatch.
3. Reconfirm F01-01's expected post-F01-00 baseline; apply only that unit. Its pre-COMMIT checks must pass. Run the independent F01-01 metadata check: exact signatures, postgres owner, definer, empty search_path, exact original bodies, authenticated/postgres execution only and F02 unchanged.
4. Verify actual PostgREST function discovery before any application release. If cache refresh is required, prepare the exact supported notification separately; this package does not silently issue one. Do not call a save/read RPC against real content as a discovery probe.
5. Stop for separately approved synthetic authorization testing and compatible application release. Expansion alone leaves current broad table/draft access in place and **does not close F01**.

Structural validation checked transaction boundaries, timeouts, named-dollar-quote balance and unchanged original RPC bodies. No PostgreSQL parser, DO-block execution or DDL rehearsal ran. Guard expected JSON/constraint deparsing is deliberately exact; if platform formatting differs, stop for review instead of weakening the guard. The execution manifest records that runtime limitation.

## Failure and recovery

A failed unit before COMMIT should roll back its own DDL; verify outcome independently if the connection result is ambiguous and do not retry blindly. F01-00 may already be committed if F01-01 fails; preserve the expanded key contract while investigating. No content is moved by these units. Do not automatically restore old broad permissions, delete book/global content or replay a full dump into the populated project. Keep public reads and pause affected authoring if needed; prepare a narrowly reviewed forward fix.

Approval must identify these guarded hashes and explicitly accept the [operation-specific residual risks](BOREALIS-F01-CUTOVER-AND-RECOVERY-PLAN.md). Approval of expansion is not approval of fixture writes, deployment or F01-02 contraction.
