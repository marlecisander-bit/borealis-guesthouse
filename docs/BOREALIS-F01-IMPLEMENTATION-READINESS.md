# Borealis F01 — implementation readiness

2026-10-21 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Existing target `rlqyruulxyanfgvnzkpe`.

**Local compatibility preparation PASS; production implementation NO-GO.** Local source, tests and a controlled production-style build are prepared. No F01 SQL, constraint, row, grant or policy was changed. No live draft/save/publish or guest operation ran. No Git publication, Netlify/Docker change, new service/database/project or deployment occurred. F01 remains unresolved in the currently deployed application/database.

## Inputs and scoped current-state verification

Read the F01 plan, Phase A security design, single-project workflow and private F02 application/post-commit evidence. `BOREALIS-PHASE-A-EXISTING-INFRASTRUCTURE-PLAN.md` is absent; the current authoritative infrastructure decision is `BOREALIS-SINGLE-PROJECT-WORKFLOW.md`. There is no separately named newer F02 application report; its verified evidence and latest workflow report were used. No architecture audit was repeated.

Executed bounded READ ONLY catalog transactions with a ten-second timeout. Queried only CMS definitions, ACLs/policies, trusted helper definitions, role memberships and distinct document-key strings. No `data`, `draft_data`, guest or account payload was selected. The SQL Editor creates/logs a query draft; no explicit Save/Share was requested.

| Check | Current evidence |
| --- | --- |
| CMS columns | Twelve exact names/types/nullability/default expressions preserved in private `fresh-metadata.json` |
| Payloads | `data jsonb NOT NULL DEFAULT '{}'`; `draft_data jsonb NULL`; no values read |
| Status | `content_status NOT NULL DEFAULT draft` |
| Identity | UUID primary key; unique(property_id,document_key); property and author foreign keys retained |
| Lifecycle | BEFORE INSERT OR UPDATE OF status trigger calls `apply_content_lifecycle_timestamps`; exact definition/owner captured |
| Policies | Same `cms_documents_public` published-or-legacy-helper SELECT and `cms_documents_admin` ALL policy |
| Grants | Existing table-level SELECT still permits draft column reads for anon/authenticated; column ACL snapshot captured; no revocation performed |
| Owners and inherited paths | CMS table/helper owners and 24 role-membership edges captured; trusted membership helper remains postgres-owned definer; anon/authenticated are not BYPASSRLS |
| Direct public views/functions | No public view text, function body text or function result type matched cms_documents in the scoped catalog scans; dynamic/transitive exposure is not comprehensively proven absent |
| F02 | Both helper ACLs remain exactly postgres/service_role EXECUTE; anon/authenticated/PUBLIC revocations persist |
| Drift | Compared policies, table/column ACLs, constraints, role memberships and existing helper definitions/owners/configuration against prior evidence: no unexpected change; F02 ACL change is expected. This is not a whole-database drift certification |

Exact metadata and query files are owner-only and Git-ignored under `.local/f01-implementation-preparation-v1/`. `definition-recovery-reference.json` preserves current expressions, trigger/function definitions and ACLs as evidence; it is not a restorable data backup or an automatic grant-restoration script.

## CMS key reconciliation and exact proposed correction

| Key | Live constraint / stored key observed | Admin editing / translation fields | Public consumers |
| --- | --- | --- | --- |
| rooms | YES / YES | Landing editor | Rooms landing and detail labels |
| experiences | YES / YES | Landing editor | Experiences landing and related labels |
| transfers | YES / YES | Landing editor | Transfers landing/process/detail labels |
| explore-koman | YES / YES | Landing editor | Explore Koman landing |
| about | YES / YES | About editor | About content/authorized preview |
| gallery | YES / YES | Landing editor | Gallery landing |
| contact | YES / YES | Contact editor | Contact page/contact information |
| footer | YES / YES | Footer editor | Shared Footer |
| book | NO / NO | Booking-page editor | `/book` introduction |
| global | NO / NO | Global editor | Homepage, PublicShell/header/mobile/shared CTA |

All ten are current `SiteDocumentKey` consumers, action field-map entries and language document-field definitions. The five landing keys are dynamic through `getLandingPageContent`; the other five are direct public reader calls. No additional stored or unused legacy key was observed. Older `pages`/`content_pages` models are separate legacy relations, not additional permitted CMS keys; no cleanup is proposed.

Added [F01-00-cms-key-compatibility.sql.proposed](security-proposals/phase-a/F01-00-cms-key-compatibility.sql.proposed): one transaction with lock/statement timeouts, an exact-current-constraint precondition, and replacement CHECK admitting precisely the ten existing application keys. It performs no seed, backfill, content update or privilege change. The constraint was **not** altered. Do not replay migration037, whose seed DML is outside this correction. Future key rollback cannot narrow back to eight once book/global rows exist without a separately reviewed preservation plan; do not delete content to make rollback succeed.

## Exact local compatibility changes

| Source | F01 change |
| --- | --- |
| `src/types/site-content-cms.ts` | Single runtime ten-key tuple; derive SiteDocumentKey from it |
| `src/lib/admin/cms-documents.ts` (new) | Typed private RPC adapter, local O/M/E and session/property checks, input/key/status validation, strict own-property/key/shape/duplicate response checks; sanitized errors and no fallback |
| `src/lib/repositories/admin/site-content.ts` | document/statuses use `borealis_admin_cms_documents`; save uses `borealis_save_cms_document`; remove all direct cms_documents reads/upserts; preserve merged editor payload/status and unrelated navigation operations |
| `src/services/site-content.ts` | Preview requires authenticated O/M/E and trusted session property, reads private repository before the public try/catch; authentication/RPC failures propagate. Public `id,data` + published filter, translations and visitor fallback preserved |
| `src/lib/repositories/admin/languages.ts` | O/M/E assertion and private own-property RPC enumeration; private read failure aborts dashboard instead of silently omitting documents; unrelated language writes unchanged |
| `src/lib/supabase/fetch.ts` | Only the two exact private RPC paths force no-store/revalidate0 after caller options, removing shared-cache tags; ordinary public cache behavior and preview RPC denial preserved |
| `src/app/admin/content/site-actions.ts` | Runtime key validation; await save before invalidation; draft saves refresh admin paths only; successful publication invalidates public CMS data/paths and shared layout for contact/footer/global |
| `tests/cms-draft-protection.test.ts` (new) | Nine behavioral synthetic regressions using actual patched functions with mocked clients/framework dependencies |

Private clients remain the current user's cookie/JWT SSR client. No service-role client/key, public RPC client, direct-table retry or anonymous preview fallback was introduced. React cache is request memoization; no shared private CMS cache was added. Explicit fetch no-store enforcement prevents private RPC caching even if an upstream option asks for force-cache. Preview errors are deliberately visible rather than appearing to show a valid published/draft fallback.

Draft save/publish merging is delegated to the proposed atomic database RPC. Local code never reads existing drafts to assemble an upsert. The application mock models the documented merge to test integration; it is not proof the proposed SQL runs correctly. Disabled membership, cross-property authorization and auth.uid verification remain database-authoritative. Existing same-field concurrent edit conflicts require a separate versioning design; this patch does not claim to solve them.

This is a preparation patch: do not run/deploy its admin/preview paths before the expansion RPCs exist. Public reads remain compatible, but patched private calls fail closed until expansion is authorized/applied. Prior unrelated dirty source/config changes were preserved, not attributed to F01. Pre-task bytes and a focused patch hash manifest are retained privately for review.

## Validation and build

| Check | Result |
| --- | --- |
| Existing suite plus new F01 tests | **134 PASS**, zero failures, pinned Node20.19.5, sterile environment, OS deny network* |
| Nine new F01 cases | PASS: O/M/E RPC arguments, denied/invalid zero-delegate paths, cross-property/malformed response rejection, draft/publish integration, public/preview separation, no-store enforcement, invalidation ordering, language failure behavior, ten-key proposal consistency |
| TypeScript noEmit, incremental disabled | PASS |
| ESLint | PASS |
| Production-style Next16.3.4 build | PASS, Webpack, normal mode with preview flags absent, OS deny network* |
| Build artifacts | 500 generated file hashes recorded and checked |
| Dependency integrity | Independent build copy matches all 22,428 canonical dependency file/link entries |
| Historical/canonical build outputs | Preserved; new local compilation output only |
| Actual SQL permission/save/merge/transaction tests | **NOT TESTED**; no migration or writer invocation allowed in this preparation |
| Live anonymous draft denial / authenticated O/M/E row tests | **NOT TESTED**; current exposure is still present |
| Actual published cache refresh / authenticated browser preview | **NOT TESTED**; requires deployed compatible app and approved synthetic runtime tests |
| Full 55-case suite | NOT RUN |

Read installed Next docs for fetch/no-store and revalidateTag before editing; used supported `{expire:0}` behavior in the existing revalidation wrapper and preserved its tag contract. Build source snapshot contains local Manrope/Cormorant fonts, no dotenv/Git/runtime profile files, and an independent APFS dependency clone. Only public Supabase configuration was supplied from the existing project, with privileged/provider credentials absent. The build could dispatch no network requests; CMS fallback/prerender success is not live-content acceptance. No application server was started.

Private evidence: `source/`, build log/result, pre/post source manifests, artifact manifest and validation logs. The compiler's expected snapshot tsconfig/next-env changes are retained in the build source manifests, without editing canonical counterparts. Build manifest SHA-256: **7f1289b53945642283d5ecf673bc98cfbf93cdd06dac034615309f06252db232**. Source-before manifest SHA-256: **de511bf0879f130eb0dd17438923a5606f87c1472b0684881554a1cdad381958**. Node executable SHA-256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

## Proposed migration order and maintenance

1. Recheck exact target, schema fingerprint, no new exposed draft-returning dependencies, trusted owners/schema privileges, F02 restrictions and recovery evidence. Stop on unexpected drift; no blanket migration replay.
2. Apply separately reviewed F01-00 ten-key constraint expansion and F01-01 RPC expansion, each atomic. Verify schema-cache visibility and effective authenticated-only EXECUTE. Expansion alone does not close F01.
3. Run authorized synthetic role/transaction tests under the existing-project constraints, then deploy only the reviewed compatible application. Drain old authoring sessions/requests; pause CMS editing during cutover. Public explicit-column reads should continue, but old private callers will break after contraction.
4. Apply F01-02 table AND column privilege contraction, published-only policy, no direct ordinary-user writes. Preserve lifecycle and trusted helper ownership; do not alter F02 or unrelated navigation policies.
5. Verify published reads, anon/auth-nonadmin draft denial through direct REST, authorized preview/save/publish, cache invalidation and maintenance recovery before reopening authoring. No real content is to be used for negative tests.

The existing expansion/contraction proposals remain unmodified review candidates. The contraction clears table/column grants before granting only id/property_id/document_key/data/status, protecting both anonymous and ordinary authenticated callers without a view. Before execution, recheck role inheritance/default privileges, exposures and RPC-name collisions against fresh metadata. No policy is applied by this report.

## Backup/export and media recovery procedure — prepared, not executed

**Backup readiness: NOT VERIFIED / NO-GO.** The prior dashboard showed no managed backup on Free. This task captured definitions only; no data export, password retrieval, Storage download or restore ran. No new database/stack is proposed or created.

A future export should use native PostgreSQL17-compatible client tooling and a verified existing-project TLS endpoint from Connect, with an owner-only service/password file rather than passwords in commands/logs. Confirm target identity before connecting. The prepared command shape is:

```sh
PGSERVICE=borealis-f01-source PGPASSFILE=/private/path/pgpass pg_dump --no-password --format=custom --file=/private/path/borealis-before-f01.dump
PGSERVICE=borealis-f01-source PGPASSFILE=/private/path/pgpass pg_dumpall --no-password --roles-only --no-role-passwords --file=/private/path/roles-before-f01.sql
pg_restore --list /private/path/borealis-before-f01.dump
```

These are unexecuted placeholders, not a configured connection or certified runnable backup. Native dump tooling/access is not verified; do not use an unnoticed Docker-based fallback under this task's restrictions. Require successful exit, a complete archive table-of-contents, object/count/definition coverage, checksums, encrypted/off-site retention and a reviewed successful restore verification before claiming restorable backup. Listing an archive alone does not prove recovery. Any managed-schema permission error or omitted dependency keeps NO-GO. Supabase's documented CLI backup has schema/data/role coverage considerations and can use a container; do not assume its default dump captures custom Auth/Storage changes. [Official CLI reference](https://supabase.com/docs/reference/cli/supabase-db-dump), [backup/restore guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

Do not restore blindly onto the populated project or create a second database to rehearse. A future restore-verification method must be explicitly reviewed within the owner's no-new-environment requirement; none ran here. Keep the exact version/configuration/extension, role/ACL, custom Auth/Storage policy, encryption/configuration and application release inventories alongside the export. Do not reset passwords/keys or disable triggers as an incidental backup step.

Prepared media inventory contract: bucket id/publicness/limit/MIME settings; per-object bucket/path/version or timestamp, size/content type, SHA-256 of separately saved bytes, and associated media_assets/hero/CMS references. Store real paths, account identifiers and bytes only in private recovery storage; reports contain aggregates. Capture originals plus variants and stable public URLs; verify saved-byte checksums and an approved recovery method. No object inventory/download was executed in this task. Database backups contain Storage metadata, not object bytes, so a dump alone cannot restore deleted images. [Supabase backup limitations](https://supabase.com/docs/guides/platform/backups).

## Rollback / forward fix

Retain expanded RPCs and an RPC-compatible release after contraction. If private authoring fails, pause authoring and forward-fix the narrow function/app path while retaining public published reads. Do not automatically restore table SELECT(draft_data), broad table grants, legacy CMS policies or public helper execution. A pre-expansion old app is not a safe post-contraction rollback. Preserve exact before definitions as evidence only. SQL transaction rollback cannot recall previously cached private material. F01 moves no payloads, but a full recovery procedure still needs verified data export; this report does not certify one.

## GO/NO-GO and exact next authorization

**GO: local patch/code review. NO-GO: production F01 implementation/deployment.** Blocking evidence: unverified restorable export, unexecuted SQL/real-role/private REST tests, key-constraint change pending, actual cache/preview acceptance untested, coordinated deployment/maintenance not yet performed. F02 remains protected. The currently deployed F01 exposure is unchanged.

Exact next authorization: perform the reviewed backup/export and recovery verification for the existing project without new environments; then authorize the exact F01-00/F01-01 expansion, synthetic rollback-only authorization tests and source-only compatible application release, followed by F01-02 contraction only after acceptance gates pass. Specify any temporary synthetic identities/content and cleanup explicitly. No publication, deployment or database change is authorized by this preparation report or inferred from successful compilation.
