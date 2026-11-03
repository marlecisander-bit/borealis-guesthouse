# Borealis F01 — final SQL expansion approval package

21 October 2026, Europe/Tirane. Target: **rlqyruulxyanfgvnzkpe**, borealis-guesthouse, organization kywcwpvblqjgfhetefxx. **GO for owner authorization review; NO-GO for execution until explicit operation-specific risk acceptance and approval.** No expansion, private RPC invocation, fixture/account creation, deployment or other production mutation occurred.

## Fresh production verification

At **11:52:34 Europe/Tirane /09:52:34 UTC**, the exact existing project dashboard returned bounded READ ONLY metadata with a10-second statement timeout. Database postgres is responsive, PostgreSQL17.6, primary/not in recovery. This is a narrow health check, not a load/whole-platform certification. The dashboard's automatic query-draft/log retention was not an explicit Save/Share operation.

Nineteen normalized metadata sections match the preceding preflight: no unexpected drift in the inspected scope. Captured12 CMS columns/defaults, constraints, lifecycle triggers, relevant RLS policies, table/column ACLs, six existing helper definitions/owners/configuration/ACLs, trusted schema ACLs, auth.uid, five role-security records and24 membership edges including grantor/admin/inherit/set options. Anonymous/authenticated users cannot CREATE in public/auth. Scoped view/function scans found no new CMS-returning dependencies; dynamic/transitive exposure is not exhaustively certified.

| Object/boundary | Verified before state | Expected after expansion |
| --- | --- | --- |
| cms_documents key CHECK |rooms,experiences,transfers,explore-koman,about,gallery,contact,footer |Exactly those eight plus book/global after F01-00 |
| CMS policies |cms_documents_public and cms_documents_admin remain |Unchanged by both units |
| CMS table/column permissions |anon/authenticated still have broad table and draft-column SELECT |Unchanged; existing F01 exposure remains open |
| Trusted membership helper |postgres-owned can_manage_property; auth.uid, matching property, is_active, allowed role |Unchanged; new RPCs explicitly pass only owner/manager/editor |
| New RPC names |Neither name exists in public, including overloads |Two exact functions after F01-01 |
| F02 reference/expiration helpers |anon/authenticated denied; postgres/service_role retained |Unchanged |
| CMS rows/translations/triggers |No content selected; lifecycle definitions captured |No payload move/update/seed; lifecycle/translation objects unchanged |

Private evidence: `.local/f01-final-approval-v1/fresh-metadata.json`, `fresh-supplemental.json`, `metadata-comparison.json`, `expected-before-after.json`. No unpublished/guest/account payload was read.

## Exact SQL and review

The approved-review candidates remain unchanged under `docs/security-proposals/phase-a/controlled-expansion-v1/`:

| Unit | SHA-256 | Bytes |
| --- | --- | --- |
| [F01-00](security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed) |`52a520dc7f3d323ad8e4b037f6b8a36c61803233793866449a80dbc6cb2604ae` |18077 |
| [F01-01](security-proposals/phase-a/controlled-expansion-v1/F01-01-cms-rpc-expand.sql.proposed) |`74128a10917c7f17fe0c1530655e058d8de0418fd682ce28af1031cd8783254a` |21430 |

[Exact F01-00 diff](security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed.diff) and [exact F01-01 diff](security-proposals/phase-a/controlled-expansion-v1/F01-01-cms-rpc-expand.sql.proposed.diff) show the fail-closed metadata guards added to the original proposals. Neither file is in migration discovery. Structural review verifies one transaction per unit,3-second lock and30-second statement timeouts, balanced named dollar quotes, no unrelated mutation and unchanged original RPC bodies. PostgreSQL parser/DDL execution and live authorization tests have **not** run.

F01-00 replaces only the key CHECK, without seed/backfill/deletion. F01-01 creates:

- `public.borealis_admin_cms_documents(uuid,text DEFAULT NULL)` → SETOF public.cms_documents; STABLE.
- `public.borealis_save_cms_document(uuid,text,jsonb,public.content_status)` → uuid; VOLATILE.

Both are postgres-owned SECURITY DEFINER functions with empty search_path and qualified references. They reject null auth.uid or failure of active property-scoped O/M/E membership. The save function additionally validates key, JSON object and draft/published status. Its single upsert retains public data on draft save and atomically merges/publishes/clears the draft on publication. Installing that body does not execute its INSERT/UPDATE.

PUBLIC/anon/authenticated/service_role function grants are cleared before authenticated-only execution is granted within the same transaction; postgres retains owner execution. Authorized O/M/E private reads are intentional, while anonymous/nonmember private access is denied by design. Actual runtime denial is still unproven. No service-role application fallback, broad table grant, booking/Storage change or CMS write invocation is included.

Guards bind exact current columns, constraints, CMS policies/ACL/RLS/owner, triggers, helper/auth.uid definitions and ownership, trusted schema permissions, role attributes/inheritance and F02 grants. Name collisions reject execution. F01-00 expects eight keys; F01-01 expects the accepted ten-key post-F01-00 state. The database name/role guard cannot uniquely identify a project: operator verification of the exact dashboard/project-bound connection is mandatory.

**Schema-cache correction to earlier narrative:** F01-01 already contains `NOTIFY pgrst, 'reload schema';` inside its transaction. The exact unchanged hash above includes that notification. It is delivered only on commit. No additional reload is automatically authorized or necessary merely because the earlier expansion-plan prose described it as separate. This final package supersedes that prose; no notification ran during preparation. SQL metadata acceptance does not prove asynchronous PostgREST discovery; authenticated HTTP discovery is a later approved test gate.

## Backup status and operation-specific risk acceptance

Verified the existing package again at **11:50:14 Europe/Tirane**: ciphertext checksums and all76 AES-256-GCM authentication checks PASS; Keychain access PASS;71 image objects/88,411,326 bytes match the encrypted media manifest. No key export, cloud copy, new dump or live restore occurred.

The database snapshot is from **10:50:01 Europe/Tirane**, approximately60 minutes old at verification. Coverage remains60 public,27 Auth and8 Storage tables with data entries,15 non-built-in roles and the recorded policy/ACL/trigger/extension inventory. Database role passwords are omitted. The ready hero's original/three variants are backed up; three pending originals were already absent. Current database content equivalence to the snapshot was not established. A fresh export requires separate authorization if needed before execution.

No successful restore or independently verified off-Mac ciphertext/key recovery exists. The package does not include all platform/service/signing/encryption configuration. Local decryption proves readable bytes, not recovery after losing this Mac or a successful Supabase/application restore.

**Owner-facing risk statement — acceptance PENDING:** “I understand that the verified backups are local to this Mac, actual restoration is untested, off-Mac/key recovery is unverified, and newer changes/platform configuration may not be recoverable. For F01-00/F01-01 specifically, I accept the residual risk of temporary interruption or recovery difficulty if a migration or operator/platform failure occurs. This is not acceptance of complete disaster-recovery readiness or approval of other live actions.”

On failure, authenticate/check the saved exports locally and compare exact definitions before proposing any recovery write. Prefer rollback of an uncommitted unit or a reviewed narrow forward fix with authoring paused. Do not restore the full archive into populated production, replay old role SQL or reinstall insecure public draft grants automatically. Whole-database/media restoration requires separate incident authorization.

## Smallest safe live authorization test plan — NOT EXECUTED

| Test | Read-only versus setup/write requirement | Acceptance |
| --- | --- | --- |
| Effective grants/owners/constraints/F02 |Catalog-only; safe now and repeated independently after commit |Exact expected metadata; no inherited bypass or signature collision |
| Anonymous direct private RPC denial |Future approved HTTP invocation; use synthetic target/arguments only |Installed/discovered functions independently confirmed; denied with no private bytes or changes; a missing-function404 alone is not proof |
| Authenticated nonmember denial |Read RPC itself is read-only; requires a separately approved synthetic identity/JWT |42501 authorization failure; zero fixture changes |
| A owner/manager/editor private reads |Read-only calls against approved **draft-only** fixtures; account/profile/property/CMS setup needs separate write approval |Each sees only A's synthetic private sentinel |
| Cross-property denial |Read RPC with A identities targeting synthetic B |42501; no B sentinel |
| Private save denial |Separate RPC-test approval; synthetic nonmember/anonymous target and invalid array payload provide a second fail-closed validation barrier |Authorization denial rather than validation-only success; no row change; never test using real content |
| Draft/save/publish merge and roles |Separate write-test approval; SQL fixtures/calls inside rollback-only transactions after side-effect review |Atomic expected state; no committed published fixture; do not claim this certifies REST transactions |
| No new RPC draft exposure |Denied HTTP cases plus auth/property boundaries |No unauthorized sentinel or cached private response; intended O/M/E access remains private/no-store |
| Public continuity |Bounded unauthenticated GETs of the seven existing informational pages; no forms/private queries |Published pages continue responding; not a CMS completeness proof |
| Final table-column draft denial |**After separately approved F01-02 only** |Metadata and zero-row/limit0 REST draft-column/wildcard requests fail permission checks without reading real drafts |

Smallest new fixture set, if separately approved: two synthetic draft properties A/B, A owner/manager/editor identities plus one nonmember, and one draft-only CMS sentinel document per property. Keep records in an explicit ID namespace; no real membership changes. Staff/disabled variants, provider isolation, exact cleanup and side-effect checks must be included if their tests are authorized. Do not create or infer credentials/accounts now.

**Same-project safety constraint:** current public CMS reads are not consistently property-filtered. Never commit a published synthetic CMS document merely to test the API: it could replace/fail public output. Use committed draft-only fixtures for HTTP private-read tests and uncommitted rollback-only publication fixtures for SQL tests. Separate REST sessions cannot see an uncommitted fixture, so those two layers are distinct evidence. Do not test anonymous draft disclosure against existing published real content. Expansion leaves the known base-table exposure unchanged; overall public-draft denial cannot pass until F01-02.

## Exact future execution commands — prepared, NOT RUN

Prerequisites: explicit acceptance/approval of the hashes above; exact target/health/fresh metadata checks; fresh package/key check and backup-age decision; verified read-only mount of the existing PostgreSQL17.11 client image and binary checksums; no conflicting CMS operation. The image is currently detached. No server/database startup is required.

A password-free, mode0600 service definition is prepared privately at `.local/f01-final-approval-v1/connection.service`, bound to the previously verified existing-project session pooler with verify-full and the official CA. No password is saved. Native psql will prompt privately for the existing password; never paste it into chat. The empty task-owned client-home prevents unrelated client configuration from being inherited. The pooler backend previously reported non-SSL; verify-full refers to this Mac-to-pooler TLS, not proof of TLS across both hops.

F01-00, only after separate approval:

```sh
TASK_ROOT='/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse'
env -i PATH=/usr/bin:/bin HOME="$TASK_ROOT/.local/f01-final-approval-v1/client-home" PGSERVICEFILE="$TASK_ROOT/.local/f01-final-approval-v1/connection.service" PGSERVICE=borealis-f01-existing "$TASK_ROOT/.local/f01-recovery-readiness-v1/client-mount/Postgres.app/Contents/Versions/17/bin/psql" -X --password --set=ON_ERROR_STOP=1 --file="$TASK_ROOT/docs/security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed"
```

STOP and run [post-F01-00 independent read-only verification](security-proposals/phase-a/controlled-expansion-v1/post-F01-00-readonly-verification.sql), using the same native command with only `--file` changed to that exact file. Also compare the fresh full metadata snapshot: exactly ten keys; all other CMS definitions/base grants/policies and F02 unchanged. Do not continue after a mismatch or ambiguous result.

F01-01, only after accepted F01-00 state and separate approval covering this exact unit:

```sh
TASK_ROOT='/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse'
env -i PATH=/usr/bin:/bin HOME="$TASK_ROOT/.local/f01-final-approval-v1/client-home" PGSERVICEFILE="$TASK_ROOT/.local/f01-final-approval-v1/connection.service" PGSERVICE=borealis-f01-existing "$TASK_ROOT/.local/f01-recovery-readiness-v1/client-mount/Postgres.app/Contents/Versions/17/bin/psql" -X --password --set=ON_ERROR_STOP=1 --file="$TASK_ROOT/docs/security-proposals/phase-a/controlled-expansion-v1/F01-01-cms-rpc-expand.sql.proposed"
```

Then run [post-F01-01 independent read-only verification](security-proposals/phase-a/controlled-expansion-v1/post-F01-01-readonly-verification.sql) with the same command and that file. Require exact signatures/default/return type, original function bodies, postgres owner, definer, empty search_path, authenticated/postgres execution, PUBLIC/anon/service_role denial, and unchanged base-table ACL/policies/lifecycle/F02. Compare to the private expected-state manifest rather than treating a zero process exit alone as acceptance. Record commit outcome privately. No RPC call or fixture write is part of these postchecks.

No outer single-transaction flag is added: each file already owns its transaction. Do not combine the units or add retry loops. If a statement fails, stop and verify rollback. If the connection drops near COMMIT, inspect metadata before deciding anything; never assume failure and repeat. If F01-00 committed but F01-01 failed, retain the additive key constraint and investigate. Do not delete book/global content to reverse it.

## Maintenance, application and F01-02 boundary

Use a quiet, agreed CMS change window: ALTER CHECK can briefly block requests, bounded by the timeouts. Expansion is additive and preserves the old application/direct-table behavior. It does not require deploying the new app immediately and does not close F01. No maintenance pause was activated here.

After expansion metadata acceptance, stop for separately approved synthetic authorization/HTTP tests. The local-fonts v2 candidate has9 focused F01 tests,121 complete candidate tests,134 canonical tests, type/lint and a network-denied build PASS with497 verified artifacts. Its18-file manifest remains unchanged. This is compiled compatibility evidence, not deployed/runtime acceptance.

Only after approved live testing and explicit source-only deployment approval may the compatible app be published through existing main/Netlify. Preserve public continuity; record the exact accepted deployed RPC-compatible revision. Pause CMS authoring and drain old editors/requests before separately approved F01-02. Contraction and post-contraction draft-denial/cache/preview acceptance are mandatory before claiming F01 fixed or reopening authoring. Keep a tested compatible release or forward-fix; never restore broad anonymous draft grants or a pre-RPC app after contraction.

## Exact next authorization

The request authorizes preparation only; no earlier general production instruction counts as acceptance of the risk statement. If the owner chooses to proceed, the required specific instruction is:

> I accept the operation-specific recovery-risk statement in this final approval package. I authorize only guarded F01-00 SHA-256 52a520dc7f3d323ad8e4b037f6b8a36c61803233793866449a80dbc6cb2604ae and guarded F01-01 SHA-256 74128a10917c7f17fe0c1530655e058d8de0418fd682ce28af1031cd8783254a on rlqyruulxyanfgvnzkpe, one transaction at a time, with the stated preconditions and independent read-only postchecks. F01-01 includes its existing transactional schema-cache notification. Stop on drift, failure or ambiguity, with no automatic retry. Stop after expansion verification. This does not authorize fixture/account/CMS data writes, private RPC tests, deployment, F01-02, credential changes or a live restore.

Until that explicit instruction is received, execution remains NO-GO. No automatic action follows creation of this document.
