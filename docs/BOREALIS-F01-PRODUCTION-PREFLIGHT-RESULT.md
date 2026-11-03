# Borealis F01 — production preflight result

21 October2026, Europe/Tirane. **Preparation complete; production execution NO-GO.** This task authorized read-only preflight, offline tests and execution/release candidates only. No production SQL mutation, CMS/booking/Auth/Storage write, commit, push or deployment occurred. F01 exposure remains open.

## Fresh checks

Existing Supabase project `rlqyruulxyanfgvnzkpe` was inspected through its exact dashboard context. Database postgres responded successfully, PostgreSQL17.6, primary/not in recovery. This is responsive-database evidence, not full platform/load certification. Catalog transactions were READ ONLY with10-second statement timeouts. No CMS data/draft payload, guest record or account payload was selected; only distinct key strings and definitions/ACLs were read. Dashboard automatically retains query drafts/logging; no explicit Save/Share occurred.

Compared the fresh narrow snapshot to the previous preparation snapshot after sorting unordered metadata arrays. Every compared section matched:12 columns/defaults, constraints, triggers, five relevant policies, CMS/admin table and column ACLs, six public helper definitions/owners/configuration/ACLs, role attributes/membership pairs, existing keys, scoped view/function exposure scan. No unexpected drift in this scope. Additional fresh metadata captures all24 membership edges with grantor/admin/inherit/set options, public/auth schema ACLs and auth.uid definition/owner. Ordinary anon/authenticated have no CREATE on those schemas. Whole-database/dynamic-dependency completeness is not claimed.

The live constraint still permits eight keys; book/global remain absent from that constraint. Private RPC names are absent. anon/authenticated still have effective CMS table and draft-column SELECT, confirming F01 remains unresolved without reading draft values. F02 helpers remain denied to anon/authenticated and executable by postgres/service_role.

Git HEAD, independently read GitHub main, and Netlify published main all remain `745b4aa56589cda5e5d0c8823ccc1cabb055e313`; deploy `6aa69097a30b800008847240`. Netlify auto-publishing is on. No staged files exist. The intended eight-file release set excludes private material; current `.local/` remains ignored. A push to main is a deployment action. Existing unrelated dirty changes were preserved.

## Recovery and tests

The existing encrypted database/roles and all71 saved public images passed the package verifier again:76 encrypted files authenticated;88,411,326 image bytes matched their encrypted manifest. Keychain access and ciphertext checksums passed. Native PostgreSQL17.11 binary hashes matched the recorded tools; archive TOC and full generation to `/dev/null` exited0, with no database target. No new dump or live restore was created. The database snapshot is from08:50:01 UTC /10:50:01 Europe/Tirane; it was approximately41 minutes old at this recheck. Content activity since that snapshot was not certified absent. A fresh export, if needed before execution, requires separate authorization.

Coverage remains60 public/27 Auth/8 Storage tables with data entries,15 non-built-in roles and the prior policy/ACL/extension inventory. Three absent pending hero originals remain a documented limitation. Off-Mac ciphertext/key recovery and actual restore remain unverified. The concise acceptance record is in the [cutover/recovery plan](BOREALIS-F01-CUTOVER-AND-RECOVERY-PLAN.md); owner acceptance is **PENDING**, not inferred from this request.

| Check | Result |
| --- | --- |
| Current local tree regressions |134/134 PASS |
| TypeScript / ESLint |PASS |
| Current local normal-mode build |PASS;500 artifacts; preview flags absent; OS network denied |
| Dependencies |22,428 entries match before/after; canonical source unchanged |
| Original F01 patch |All eight recorded file hashes unchanged |
| Minimal release-candidate F01 tests |Nine PASS; normal-mode transport scope |
| Minimal candidate TypeScript / ESLint |PASS |
| Minimal candidate offline build |FAIL: published baseline fetches Google Fonts; OS-denied network blocks Manrope/Cormorant Garamond |
| SQL structural/source validation |Transactions/timeouts/dollar quotes checked; original RPC bodies unchanged |
| PostgreSQL parser/live DDL rehearsal |NOT RUN |
| Actual RPC/RLS/JWT/save/publish/cache behavior |NOT TESTED |

The current local tree includes a prior local-font change. The minimal F01 release candidate excludes that unrelated change and therefore has a distinct build result. Do not transfer the current-tree build PASS to the candidate. Network restrictions were not loosened and unrelated font changes were not silently added. The candidate build gate needs a separately reviewed resolution before release acceptance.

Private evidence: `.local/f01-production-preflight-v1/`; full safe-run evidence: `.local/safe-checks-20261021T092602316880Z/`. Fresh bounded GET-only checks returned HTTP200 HTML on all seven approved informational pages, with no redirects or Set-Cookie; no bodies were persisted and no forms or writer RPCs were invoked. These do not certify CMS completeness or full browser behavior.

## Decision and next authorization

**GO:** review the exact guarded SQL diff and source-only candidate. **NO-GO:** SQL execution, application release or F01 completion. Blocking gates: explicit operation-specific recovery-risk acceptance pending; no SQL/runtime authorization proof; minimal release build unresolved; fixtures/deployment/contraction not authorized.

The request explicitly requires stopping before F01-00/01 and says it is not acceptance of residual recovery risk. Complete the candidate build resolution, then separately accept the recorded risks and approve the two named guarded expansion units and their read-only postchecks. Synthetic CMS/Auth writes, deployment and F01-02 remain separate approvals. No automatic next phase follows this report.
