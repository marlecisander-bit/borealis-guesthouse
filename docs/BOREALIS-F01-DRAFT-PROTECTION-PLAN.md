# F01 — draft confidentiality remediation plan

2026-10-21 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. **DESIGN ONLY — no SQL executed, no application changes, no deployment.**

**Decision: GO for review and isolated implementation planning; NO-GO for production application.** Exact proposed SQL is attached separately. It has been statically reviewed, not executed or database-tested. Fresh owners/ACL/dependency metadata and a tested compatibility release are required first.

## Confirmed boundary and exact objects

Recorded `public.cms_documents` columns: id,property_id,document_key,data,draft_data,status,created_at,updated_at,created_by,updated_by,published_at,archived_at. It uses public.content_status, primary key id, unique(property_id,document_key), a property foreign key and author user foreign keys. Lifecycle triggers/functions and document_key check must be preserved. Capture their current exact definitions before promotion; do not reconstruct the table from migration007, whose key list is older than current application keys.

The recorded policies are `cms_documents_public` (published OR can_manage_site_content) and `cms_documents_admin` (ALL via that helper), with broad table grants to anon/authenticated. Source migration007 still defines `can_manage_site_content(uuid)` using legacy admin_users emails. The newer active-profile helper is `public.can_manage_property(uuid,public.admin_role[])`, defined in migration016. Its recorded source hash is å`4ac2fc5af25fcb95f60e304de4911bbcc217b1af5c85ce40a9b7154dd6eb6121`; exact current owner/body/privileges need refreshing, not blindly trusting the historical name.

Published rows can retain a different draft_data. RLS alone does not hide a column. Revoking SELECT(draft_data) while leaving table SELECT does not fix it; leaving table SELECT to every authenticated user also leaves the signed-in non-admin disclosure. PostgreSQL privileges are additive. [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html).

## Selected smallest bounded design

Keep both payload columns and every row in place. Retain the public published reader, but restrict anon AND authenticated to a five-column public projection: id,property_id,document_key,data,status. Replace the two policies with published-only SELECT, remove direct client writes to this table and give active owner/manager/editor members two narrowly authorized SECURITY DEFINER RPCs for private read and save. No new view or private-data copy is needed.

This is smaller than moving drafts to another table, avoids a copy/backfill/dual-write transition and retains merge/draft/publish behavior. A separate private draft table remains an alternative if future consumers require ordinary authenticated table editing; it is not selected here. Merely revoking anon, masking JSON in React, adding a view without removing base-table grants, or using security_invoker on a view while keeping permissive base access is insufficient.

The definer functions deliberately bypass table restrictions but explicitly require auth.uid plus active membership in the requested property and O/M/E roles. Staff, disabled, non-member, legacy-email-only and other-property users fail. No caller-supplied actor, role or email is trusted. Functions use empty search_path with qualified tables/types/helpers, explicit owner postgres and restricted EXECUTE in the same creation transaction. No dynamic SQL, user-chosen relation or service-key application workaround is introduced. Trusted owners/schema ACLs are prerequisites, not established by the proposal. [PostgreSQL function security](https://www.postgresql.org/docs/current/sql-createfunction.html).

## Separate proposed migration units

1. [F01-01-cms-rpc-expand.sql.proposed](security-proposals/phase-a/F01-01-cms-rpc-expand.sql.proposed): adds `borealis_admin_cms_documents(uuid,text)` and `borealis_save_cms_document(uuid,text,jsonb,public.content_status)`. No existing privilege is removed yet. This stage alone does NOT remediate F01.
2. Compatibility application release, after isolated tests and separate approval.
3. [F01-02-cms-privilege-contract.sql.proposed](security-proposals/phase-a/F01-02-cms-privilege-contract.sql.proposed): clears table and column grants for PUBLIC/anon/authenticated, grants only the public projection, replaces the two recorded policies and leaves service_role grants/lifecycle triggers untouched. It uses short lock/statement timeouts and one transaction. Unknown policies, ACLs, columns or function-name collisions stop promotion; do not add IF EXISTS to hide drift.

These are documentation attachments outside database/migrations and cannot be treated as applied migrations. Assign real migration versions only in the separately approved implementation. No GRANT/REVOKE, CREATE FUNCTION or NOTIFY was executed now.

## Exact proposed application compatibility changes

| Call site | Proposed change | Preserve |
| --- | --- | --- |
| `src/lib/repositories/admin/site-content.ts` document | Call `db.rpc('borealis_admin_cms_documents',{target_property:s.propertyId,target_document_key:key})`; require successful result; map at most one row | Existing data+draft merge and draft indicator, property from trusted session |
| Same module statuses | Read documents through same RPC with target_document_key:null; derive key/status/draft flag; keep other table queries | Private draft status visible only to authorized member |
| Same module saveDocument | Replace direct read/upsert with `db.rpc('borealis_save_cms_document',{target_property:s.propertyId,target_document_key:key,input_data:data,target_status:status})` | Existing field allowlist/validation and post-success revalidation remain in site-actions.ts |
| `src/services/site-content.ts` getSiteDocument preview branch | Obtain requireAdmin/getAdminSession O/M/E and session.propertyId; use private read RPC, choose draft_data ?? data | No anonymous draft fallback; no service-role key; preview errors fail visibly/safely rather than pretending draft loaded |
| Same public branch | Keep cms_documents select id,data, published filter; optionally explicit property context as separately reviewed requirement | Current public CMS projection and cache tags; no private RPC in public cache |
| `src/lib/repositories/admin/languages.ts` document enumeration | Use private read RPC for own property's document ids/keys; do not expose returned payloads to unrelated UI/logs | Include unpublished documents in authorized translation navigation |
| All other/dynamic consumers | Scan direct cms_documents selects/writes, generated types, count queries, embeds, exports, views and exposed definer functions | No SELECT * client fallback; explicit public columns only |

RPC private reads use the authenticated SSR transport and no-store, never fetchPublicCms's shared data cache. Retain application role checks as defense in depth; database RPC authorization remains authoritative. Do not change the legacy can_manage_site_content helper globally: navigation also uses it and requires a separately reviewed legacy authorization reconciliation. This proposal removes that helper from cms_documents policy evaluation only.

The save RPC merges existing data || existing draft || submitted fields in a single upsert. Draft save retains existing published data/status; a new draft row has empty public data and status draft. Publish moves merged payload into data, clears draft_data and sets published. Existing created_by is preserved; updated_by is derived from auth.uid. Existing lifecycle triggers own published/archived timestamps. Archive/new-key semantics must match fixtures; no new archive behavior is added. This does not solve every F04 optimistic-edit conflict: stale submissions containing the same keys can still overwrite newer edits and need a separate version contract.

## Expected behavior and synthetic validation

Use two synthetic properties A/B and seeded O/M/E/S/disabled/non-member/legacy-only identities. No real draft or guest data. Fixtures include published A with distinct public sentinel and private draft sentinel, draft-only B, archived document and a document with no draft. Fixture provisioning is future isolated test work, not an Auth change in this task.

| Case | Before (evidenced or hypothesis) | Required after |
| --- | --- | --- |
| anon explicit id,data published read | Works through current public reader | Same published sentinel only |
| anon/auth-nonadmin select draft_data or * | Recorded grants/policy permit draft on a published row | Permission error, even through REST aliases/embeds/column expressions; no draft bytes |
| anon/auth-nonadmin draft-only/archived row | Anonymous ordinarily filtered; legacy policy can widen authenticated access | No public row from those states |
| active A O/M/E private RPC | Existing editor uses direct SELECT | RPC returns only A, including draft-only rows; B denied |
| S, disabled, non-member, legacy-only | Legacy helper may differ from active profile model | Read/save RPC denied with42501; no row changes |
| draft save on published A | A stays published; B draft stored | Public A unchanged; authorized preview sees B; status indicator shows draft |
| publish A | Copy draft/merge, clear draft | Atomic merged public data; draft cleared; author/timestamps valid; cache invalidated only after success |
| direct INSERT/UPDATE/UPSERT/DELETE as authenticated editor | Previously policy-dependent direct writes | Denied; only authorized save RPC succeeds |
| wrong property/key/status/null/array payload | Source constraints/validation | Denied; table check and RPC allowlist agree; no arbitrary key creation |
| concurrent first insert/saves | Application read-then-write race | Unique row, atomic merge and no partial draft/publish state; document any same-key last-writer behavior |
| public/preview caches | Existing caches may contain draft responses from unauthorized external queries | No new private data enters shared cache; verify chosen API/CDN cache behavior and invalidate owned caches through approved mechanisms |
| exposed views/functions/embeds | Catalog coverage incomplete | None bypass projection or explicit private role check |

Run SQL examples in the separate synthetic-denial attachment only after the target guard/fixtures exist; supplement with real isolated PostgREST and authenticated preview/UI tests. Record sanitized pass/fail, not sentinels in production logs. Verify has_column_privilege for both roles and inherited memberships; RLS=false/owner/service-role tests do not represent anonymous access.

## Ordering, interruption, recovery and decision

Expand RPCs → refresh schema cache and verify availability → deploy compatibility app → drain old admin requests/open editor sessions → contract privileges → verify public published reads and isolated-role acceptance evidence → reopen authoring. Public read URLs/projections remain unchanged. Old authoring/preview builds fail after contraction; plan a brief CMS-authoring maintenance window. Do not silently run a privileged fallback if schema-cache lag or locking fails. Transaction timeout means rollback of that migration, not an automatic retry.

Before any production promotion, obtain fresh metadata-only owner/prosecdef/search_path/table+column ACL/role-membership/policy/view/function-dependency/trigger/constraint inventories, verify no alternate exposed function returns draft_data, reconcile real document keys and take recoverable definition backups without copying payloads into reports. Existing metadata lacks complete column ACLs, function owners, inherited roles and view exposure. That alone keeps production NO-GO.

No payload move means SQL rollback does not require draft-data restoration. Keep the expanded RPCs and roll back only to an RPC-compatible application version; restoring broad SELECT grants or the legacy public/admin policies would reopen F01 and is not an acceptable automatic rollback. Forward-fix a function or retain authoring maintenance with public published reads. Prior unauthorized copies/cache entries cannot be recalled by a permission change. Physical privacy of already-public media objects is outside F01.

**GO/NO-GO:** design prepared; isolated execution/compatibility tests NOT RUN. NO-GO for production until every freshness, role, direct-API, preview/publish and recovery gate passes and the owner separately authorizes implementation/deployment.
