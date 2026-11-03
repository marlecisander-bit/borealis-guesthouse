# Borealis F03 — production readiness

21 October 2026, Europe/Tirane. Existing project **rlqyruulxyanfgvnzkpe**, borealis-guesthouse, organization **kywcwpvblqjgfhetefxx**, Free. Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Read-only inspection and local compatibility identity checks COMPLETE. Production release NO-GO.** The original F03 proposal cannot yet be accepted as the complete authorization correction: live hero metadata policies use a legacy-email helper. Service operation enforcement, deployed token lifetime, real-role HTTP behavior and recovery/cutover gates also remain unverified. No policy or application was deployed, and no live mutation test ran.

## Fresh metadata and scope

Read the five requested reports, existing F03 proposal and installed SDK implementation. Three bounded SQL Editor batches ran in **BEGIN READ ONLY**, each with a **10-second statement timeout**, ending COMMIT. They selected only catalog definitions/ACLs/constraints and aggregate Storage/media counts. No draft/guest payload, Auth user list, membership identity, individual object name/content or existing signed token was selected. Query drafts are automatically saved by the SQL Editor; no explicit Save/Share action was used. This is read-only database inspection, not execution of the F03 policy proposal.

Primary result: **2026-10-21T12:25:35.876668+00:00** (14:25:35 Europe/Tirane); supplemental constraints at **2026-10-21T12:27:26.751994+00:00**. Database postgres responds on PostgreSQL **17.6**, transaction_read_only=on. Exact project/organization links and Free status were observed in the dashboard. No new environment or credentials were created.

| Check | Fresh evidence |
| --- | --- |
| Bucket | Only `public-media`; public=true; limit **10,485,760 bytes**; JPEG/PNG/WebP/AVIF |
| Storage object policies | Precisely three legacy authenticated INSERT/UPDATE/DELETE policies; admin_users email check; no SELECT policy recorded; no storage.buckets policy recorded |
| Media metadata policies | Three legacy email/property writers plus `media_assets_admin_manage` ALL with active O/M/E helper; `media_assets_public_read` published+visible SELECT retained |
| Hero policies | Admin read/insert/update all use `can_manage_homepage(property_id)`; public SELECT allows ready rows |
| Membership authority | admin_profiles user_id/property_id/role/is_active; unique(user_id,property_id); self/owner policies recorded; no account membership values inspected |
| Trusted active helper | postgres-owned SECURITY DEFINER `can_manage_property(uuid,admin_role[])`; active profile, auth.uid, property and requested role checks |
| Legacy hero helper | postgres-owned SECURITY DEFINER `can_manage_homepage(uuid)` still checks **admin_users email/property/role**, without active-profile check |
| Operation helpers | `storage.operation()`, `allow_only_operation(text)`, `allow_any_operation(text[])` present, owned by supabase_storage_admin; invoker/STABLE; effective EXECUTE available to ordinary roles |
| Operation semantics from definition | Read current_setting('storage.operation',true); normalize optional `storage.` prefix; exact matches; absent context fails closed |
| Object inventory | **71 objects / 88,411,326 metadata-reported bytes**, one hero original/three optimized variants; **zero incompatible paths** under the proposed canonical-path predicate |
| Media references | **64 rows**, zero property-prefix mismatches, zero missing object matches |
| Privilege boundary | RLS enabled on inspected tables; ordinary anon/authenticated have no CREATE on public/storage schemas; no column ACL exceptions on inspected Storage/media/hero tables |
| F02 effective EXECUTE | Both internal helpers denied to anon/authenticated; retained for postgres/service_role |

Storage objects/buckets are owned by supabase_storage_admin; media/hero/profile tables by postgres. Existing anon/authenticated table DML grants remain RLS-dependent. Direct owners and service_role are privileged/bypass identities; member revocation cannot constrain a leaked privileged key. The proposal grants no new table/schema privilege and explicitly narrows its new helper's EXECUTE. Fresh default-function grants must nevertheless be accounted for by exact ACL assertions in any final guarded revision.

### Policy comparison and exact-fingerprint limitation

All **14 inspected policies** match the historical policy set after whitespace normalization; no additions or removals were found. Four overlapping table owner/ACL/RLS records (profiles, legacy users, media_assets, storage.objects) match their historical snapshot. All **24 role-membership edges**, including grantor/admin/inherit/set options, match the later F01 preflight evidence. Helper owner/ACL/configuration/definer attributes match. This is scoped comparison, not whole-database drift certification.

There is a raw definition-byte discrepancy in three helper snapshots. Their definitions match when leading line indentation is ignored, but fresh **server-computed** MD5 values differ from earlier locally preserved representations:

| Function | Earlier local definition MD5 | Fresh server definition MD5 |
| --- | --- | --- |
| `can_manage_homepage` | `c970c3d7d2ff255051bd11c0584dec99` | `c970c3d7d2ff255051bd11c0584dec99` |
| `can_manage_property` | `902c6a9edf7b0104ebec93ee5c25ccfd` | `7a19027fe9a390687ef548b974f90273` |
| `expire_booking_holds` | `fff295524a5800093645e319857bcf59` | `caba2c5f17af066a3ac77b96ee47e80e` |
| `next_booking_reference` | `e71854af59f2f791caf40ad8e85d35c7` | `a1f71822bff923f67bebebbf5fbab8ef` |

Do not claim exact fingerprint continuity or silently replace guard hashes. Existing F01 guarded proposals embed the older values, so their exact checks would stop against these fresh definitions. The origin of the indentation discrepancy (historical capture versus actual byte-level change) is not established here. Preserve both representations; reconcile any execution preconditions in a separately reviewed revision before a future SQL run. No semantic authorization change was identified from this comparison, and fresh F02 ACL checks pass. F01 preparation source files/proposals are intact; none was changed or executed.

## Policy reconciliation and newly confirmed blocker

Original proposal: [F03-media-policy-consolidation.sql.proposed](security-proposals/phase-a/F03-media-policy-consolidation.sql.proposed), SHA-256 **`c37193538e29df1f67a0a1fecbeba87209b40584f7b4bc08cef1c3f07febf217`**. It is unchanged, outside migration discovery, unexecuted and not release-approved. No replacement proposal is silently substituted by this report.

| Requirement | Static result / remaining acceptance |
| --- | --- |
| Active O/M/E object authorization | Helper checks auth.uid, active admin_profiles, exact property prefix and roles; excludes staff/disabled/nonmember by design; real-role execution NOT TESTED |
| Property boundary | Only public-media and canonical lowercase UUID prefix; rejects ambiguous segments, percent/backslash and trailing slash; current aggregate paths compatible |
| Metadata ownership | media_assets writes require path prefix = property_id and active authorization; same-property team editing preserved, not restricted to original uploader |
| UPDATE source/destination | Storage and metadata use both USING and WITH CHECK; both old and proposed row must be authorized; test target/property-only changes separately |
| Signing denial | INSERT permits exact object.upload only; sign_upload_url/upload_signed/move/copy/S3/resumable excluded by operation predicate; real HTTP context/denial NOT TESTED |
| Public continuity | Bucket/public URLs unchanged; media_assets_public_read retained; public image retrieval intentionally crosses property boundaries; no draft-photo secrecy claim |
| Unrelated buckets | Only one bucket exists now; helper is bucket-specific; no global Storage revoke/toggle/object move. Any additional bucket/policy before rollout invalidates this inventory |
| Exact execution safeguards | BEGIN/COMMIT, 3-second lock/30-second statement limits present; helper-availability check present. Exact current policy/grant/function/default-ACL/role preconditions and effective postconditions still need a guarded execution candidate |
| Hero metadata authorization | **FAIL as a complete consolidation**: leaving current hero policies unchanged retains the legacy helper and may also block active editors absent from admin_users |

The F03 design's conditional assumption that `can_manage_homepage` resolves through active profiles is **false on this project**. This is an existing recorded definition, not proof of a newly introduced exploit or affected account. Fresh hero constraints enforce a broad property-prefixed original path (`property_id/hero/%/original/%`), kind/status and a 24 MiB metadata ceiling; they do not replace active membership authorization or the app's exact path validation. The bucket/app limit remains 10 MiB; no constraint or bucket change is proposed automatically.

Required correction before rollout: prepare a **separately versioned, reviewed hero-policy delta** for hero admin read/insert/update using active O/M/E/property authorization, with exact source/target ownership checks and a deliberate original/variant-path integrity contract. Preserve ready-state public reads. Prefer a scoped policy correction over silently changing a shared can_manage_homepage helper used elsewhere; review its call sites before any broader helper change. Keep admin_users and real memberships untouched. Add legacy-only/disabled/active-without-legacy and cross-property hero-metadata tests. The current application gate cannot secure direct REST metadata writes.

## Signed-upload API and transition

The installed SDK still implements createSignedUploadUrl as POST `/object/upload/sign/<bucket>/<path>` and uploadToSignedUrl as the corresponding token upload; signing options do not provide a caller-selected expiry. The local hero patch no longer calls either method. Current official documentation says upload capabilities work without further authentication and last **two hours**. This is the verified **documented contract**, not a verified maximum for the deployed service. [Supabase signed-upload reference](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

Fresh helper definitions match the documented exact operation comparison and optional-prefix normalization. Current upstream operation names identify normal upload, signing and signed completion distinctly. These references do not establish the deployed server build or prove that its HTTP handlers supply the correct context. [Operation-helper documentation](https://supabase.com/docs/guides/storage/schema/helper-functions), [upstream operation definitions](https://github.com/supabase/storage/blob/master/src/http/routes/operations.ts).

**Verified deployed maximum token lifetime: NOT ESTABLISHED.** No token was minted/read/revoked to measure it. No supported token-issuance ledger was established by the bounded inventory; object rows and pending hero rows are not a complete token inventory. Obtain the deployed release/configuration or authoritative platform confirmation, and later characterize only expressly authorized synthetic capabilities. Two hours alone is insufficient evidence to reopen authoring.

Future transition, not performed:

1. Resolve the hero-policy and exact-guard gaps; review final combined source/policy candidates and recovery limitations. Approve a media-authoring maintenance window separately. A UI pause by itself does not stop direct SDK signing.
2. Deploy the authenticated-compatible app while authoring stays paused. The app start endpoint then stops minting tokens. Old loaded clients require refresh and fail closed; preserve public GET delivery. Do not use this deployment time as the security cutover epoch.
3. Apply separately authorized final policies that deny signing at the **Storage service boundary**, not only in UI code. Verify direct signing denial for enabled fixture users and normal authenticated operations through real HTTP before reopening.
4. Record commit/denial time and conservatively bound the **last possible issuance completion**, including signing requests/transactions authorized before the policy change. Any unexpected successful signing restarts the bound and stops release. Do not log token values.
5. Drain capabilities until that last-issuance upper bound + **verified deployed maximum lifetime** + measured clock/request margin. Also drain or account for authorized uploads that begin before expiry and finish later. If request duration or the last issuance cannot be bounded, remain paused/NO-GO. Excluded resumable/S3 routes need explicit denial tests rather than assumptions.
6. After both capability and in-flight drain, verify fresh disabled-user checks deny new operations, ordinary O/M/E paths work, cleanup is scoped, and public bytes remain available. Restore authoring only after accepted evidence.

Failure handling: stop at drift, unsupported operation, unexpected success, orphan/cleanup failure or unbounded drain. Keep public delivery available and authoring paused; forward-fix the narrow reviewed path. Do not automatically restore broad legacy policies or signed-only UI. Do not rotate keys, revoke real users or delete media to force expiry. Database rollback does not undo object bytes, minted capabilities, HTTP transactions or CDN caches.

## Live authorization test design — NOT EXECUTED

Every upload/overwrite/delete/metadata INSERT/UPDATE or signing attempt is classified as **mutation-capable**, even if denial is expected. Signing probes can mint a capability if the test fails. None is authorized by this preparation task. Future fixtures must be explicitly approved, use harmless synthetic rasters and a private allowlist of generated properties/users/object IDs, and exclude all existing media/accounts. Provider sends/automation side effects need to be excluded before fixture creation. No public CMS document should be created for this purpose.

| Test | Required fixture/action | Expected final result | Class |
| --- | --- | --- | --- |
| Active owner/manager/editor | Distinct active O/M/E users; normal upload in A, including one absent from admin_users | Correct bytes in A and own-property metadata; no B effect | Mutation-capable |
| Staff/nonmember/disabled/legacy-only | Dedicated users; disabled fixture only, never a real member | Upload/overwrite/delete and private metadata writes denied; state unchanged | Mutation-capable + fixture Auth/membership changes |
| Cross-property | A editor targets B; multi-property user owns A but is staff in B | No B object/metadata change; only active O/M/E properties accepted | Mutation-capable |
| Source/target update | Metadata property-only/path-only changes, cross-bucket rename/move/copy | Both source and target checks; no escape or implicit move grant | Mutation-capable |
| Hero metadata | Active-without-legacy and legacy-only/disabled direct REST; start/finish | Active own-property access succeeds; legacy-only and cross-property writes denied | Mutation-capable |
| Original/variant processing | Synthetic originals plus generated derivatives; expired session between stages | Authenticated transfer, exact paths and sizes; no privileged retry | Mutation-capable |
| Path matrix | Root/unprefixed, uppercase UUID, dot/dotdot, double/trailing slash, backslash/percent, invalid UUID | Fail closed; no cast exception or side effect; inspect actual HTTP normalization | Mutation-capable |
| Type/size | Genuine supported formats; corrupt/unsupported; exact/over 4 MiB ordinary and 10 MiB hero/variant caps | Valid accepted, invalid rejected; no partial publication | Mutation-capable |
| Direct signing | O/M/E direct SDK/REST sign endpoint; excluded upload routes | Denied, no token issued; unexpected token stays private, release stops | Capability-creating |
| Old capability | Synthetic token minted only under future explicit approval before cutover | Characterize pre-expiry behavior; after verified drain completion rejected | Capability-creating + mutation-capable |
| Disable after issuance | Disable only dedicated fixture membership; retain its old JWT/token | New auth checks deny; old capabilities only claimed invalid after proven drain | Fixture changes + mutation-capable |
| Processing/metadata failure cleanup | Inject derivative/save failure and permission expiry | Only acknowledged attempt derivatives removed; original retained; cleanup/reset failures visible; no existing object touched | Mutation-capable |
| Public retrieval | Bounded approved public/synthetic URLs before/after | Anonymous GET bytes/content type/hash stable; public retrieval intentionally unrestricted | Read-only GET |
| Private list/download | Fixture JWTs plus existing schema/policy checks, no private real object | Own-property authorized operations only; no anonymous listing grant | Read-only authenticated fixture reads |
| Version/context and transaction failure | Actual relevant HTTP operations and separately authorized SQL/policy transaction tests | Exact context, rollback/no partial policy cutover; no manually spoofed GUC proof | Separate controlled execution |

For each denial, inspect allowlisted object existence/bytes **and** metadata before/after, not status alone. Capture only redacted role/case/status/count/hash evidence. Negative tests that unexpectedly succeed stop the run and require scoped cleanup/drain; no automatic retries. Cleanup authorization must name fixture-owned rows/objects/users explicitly, preserve originals intentionally needed for recovery, and never use wildcard or existing-media deletion. No new environment is required by this plan; all future execution is against the owner's selected existing platform with its public-side-effect constraints.

## Release identity and offline evidence

The nine-file F03 manifest and focused patch remain exact:

- Source manifest SHA-256 **`9f4ac80472d0aa1f76382d5220644c3832e5259b2ab2d14270a1b700545e04e4`**.
- Focused patch SHA-256 **`4b35aa275bad56929844fecb5e35f8fa1901d32ab1e10795e55980798d3bba33`**.

| Source-only F03 inventory | SHA-256 |
| --- | --- |
| `src/app/admin/content/homepage/hero-upload/route.ts` | `e3fce4aff8531f2cd5fdbdb7eb57bd5c67d1029e34a76f0a7ff8b7fc8713fe0c` |
| `src/app/admin/media/upload/route.ts` | `22f478c65d72b2434e8b20bef3d91afa5ea3691c8e0094e8820e8e19548e6b28` |
| `src/components/admin/HeroImageFields.tsx` | `a73c9912dc872c701170b91b8d1a9adf1b066aaa98144dc9b6b0f4f36086560b` |
| `src/lib/hero-image-config.ts` | `043da9f7a6d57c4d742d8c8de49ae29efa3928716bda5b9846a93491676fba03` |
| `src/lib/hero-image-processing.ts` | `f0cd6275c25bd7d9d01ae3a075f0b0882df81039bded25dfdbafaa61be25dbf6` |
| `src/lib/hero-original-upload.ts` | `925dc5dd807d41def21b2d20de8b39fc23707ba04d67bad44f610e74dce3805a` |
| `src/lib/media-upload-security.ts` | `b9b51e6a75a4deb880f480c0e0d54e2e8070727349d89df8ba38984fe0f5a102` |
| `tests/hero-upload-route.test.ts` | `eee3f47ab9a241f6027219ff53cb2c7f5206188c0ec6d4ef7dc9967708a4e22e` |
| `tests/storage-compatibility.test.ts` | `dab9932d320f7845dbce3a7dbcddfaf7d7a0877e5afcaedb672b05421d050451` |

Fresh comparison confirms current `src`, `public`, `tests`, package/lockfile and relevant build configuration match the final validated snapshot `.local/safe-checks-20261021T103202007014Z/`. Rehashed all **503 build artifacts** and **22,428 dependency entries**, zero mismatch. Reuse the passing results: **162 unit tests**, **25 focused upload/processing tests**, TypeScript, ESLint and clean network-denied Next16.3.4 production-style Webpack build, Node20.19.5/npm10.8.2. No install, source edit or expensive rebuild was needed. These are offline/mock/image-processing results, not live RLS acceptance. Node20 lifecycle/deprecation remains recorded maintenance work.

F01 files/proposals and its separately inventoried minimal candidate remain untouched. F02 fresh effective ACL denial passes; no booking transaction was called. The validated canonical build includes pre-existing F01/preview preparation; a **combined clean production release inventory/build excluding preview-only changes has not been certified here**. Do not publish the whole dirty tree. No new preview safeguards, secrets or dependencies were introduced by this task.

Fresh Netlify dashboard read confirms published main **745b4aa56589cda5e5d0c8823ccc1cabb055e313**, deploy **6aa69097a30b800008847240**, and **auto publishing ON**. A main push is a deployment action. No trigger/lock/toggle/settings change was made; staging remains empty.

## Public reads and recovery

Read-only public homepage GET returned 200 and identified already-public media URLs. Two bounded anonymous image GETs returned **200 image/jpeg**, **92,623 / 114,623 bytes**; bodies were hashed in memory, not persisted, and no auth credentials/cookies were sent. Edge Set-Cookie headers were present; no cookie values were retained or reused. No private objects were read. This proves current sample availability, not all-object rendering or future post-policy continuity.

Re-authenticated the existing recovery package under OS-denied networking: **76 encrypted files PASS; 71 media objects / 88,411,326 bytes verified**, local Keychain access succeeds, no key/plaintext export or database restore. Ciphertext hashes remain database `fb214fca3e466db4318981f6624a2871819b294939d4217f266f950a2c271123`, roles `374fce3fa5fae8b3d81bd81108aada7f102864cc6f55f320fc619d89869a4a21`, package ZIP `daf5eeff8c5876c33436cd1afc8427e2a39457c843aaca162c772ca90793b90c`.

Database snapshot is **08:50:01 UTC today**, approximately **3h40m old** at the local readiness check; it does not cover later changes by definition. Fresh object counts/sizes/references match the earlier aggregates, but this is not proof of byte-for-byte current backup freshness. Existing coverage remains 60 public/27 Auth/8 Storage tables and role/policy metadata; three pending hero originals were historically absent. Full restore, off-Mac retention, independent key recovery and complete Auth/Storage configuration/extension/platform-key recovery remain **NOT PROVEN**. Existing public bucket backup does not justify private guest-file retrieval. No new export/media backup or restore ran.

Private evidence: `.local/f03-production-readiness-v1/` contains the read-only query text, fresh results, authoritative fingerprints, comparisons, verification and Netlify state. It remains Git-ignored and owner-private; the report contains no actual account/object identifiers, token or customer payload. Historical source/recovery files were preserved.

## Decision and exact next authorization boundary

**NO-GO for F03 production policy execution or deployment.** Blockers:

1. Correct the hero metadata legacy-helper path in a separately versioned policy design; retain public reads and same-property integrity.
2. Prepare guarded exact policy/helper/default-ACL/role before-and-after assertions; reconcile the raw helper fingerprints before any exact guarded SQL execution, including future F01 stages.
3. Verify deployed Storage release/operation context, signing denial, maximum capability lifetime and in-flight bounds through authoritative metadata/support and separately approved synthetic HTTP tests.
4. Agree on recovery limitations, authoring maintenance, final clean source-only release composition and rollback-compatible forward-fix behavior.

**Recommended next task:** prepare and review the narrowly scoped F03 hero-policy/guard revision locally, preserving this original proposal; no live change is needed to do that. This report does not ask for immediate production mutation approval or imply an execution-ready hash.

Before future live work, the owner must separately authorize the **reviewed final SQL hash(es)**, exact existing-project synthetic properties/users/membership changes and object allowlist, mutation-capable test cases and cleanup, media-authoring maintenance, source-only Git/Netlify release, and capability/in-flight drain acceptance. The eventual request must explicitly acknowledge the verified recovery limitations and deployed token bound. Approval to inspect or past general test-platform authorization does not automatically start those stages. No automatic implementation follows.
