# F03 — Storage authorization consolidation plan

2026-10-21 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. **DESIGN ONLY — no SQL executed, no application changes, no deployment.**

**Decision: GO for isolated design validation; NO-GO for production.** Active-membership policies can replace the legacy email checks, but current Storage-server operation support and outstanding signed upload capabilities are unresolved deployment gates. No policy was applied and no user, membership or object was changed.

## Exact recorded objects and affected callers

`storage.objects` has three recorded authenticated write policies: “Admins can upload public media”, “Admins can update public media”, “Admins can delete public media”. They use admin_users email matches and lack current active role/property-prefix checks. No Storage SELECT policy was recorded. `public.media_assets` has three legacy policies “Admins can insert/update/delete media”, plus `media_assets_admin_manage` using current can_manage_property(O/M/E), and `media_assets_public_read` allowing published+visible rows. Remove the OR-combined legacy branches, not merely add another stricter permissive policy.

`public.admin_profiles` is the membership authority: user_id,property_id,role,is_active. `public.admin_users` remains untouched as historical/other-feature data; do not delete it or create memberships automatically. Existing admin_profiles self/owner policies and the trusted can_manage_property function must be fingerprinted and tested, but are not changed by this proposal.

`public.homepage_hero_assets` has read/insert/update policies using can_manage_homepage and ready-state public read. That helper's migration016 definition uses active profiles through can_manage_property. Verify its live body/owner and same-property constraints before leaving those policies unchanged. No bucket recreation, public/private toggle, size/MIME change or object move is proposed. Recorded public-media is public,10 MiB, JPEG/PNG/WebP/AVIF. The hero UI accepts up to24 MiB, so uploads above the bucket limit are a pre-existing compatibility issue requiring a separately reviewed product/config decision; do not silently raise the bucket limit in this security fix.

Application call sites:

- `src/app/admin/media/upload/route.ts`: ordinary upload through SSR user credentials, path `<property UUID>/<asset UUID>.<ext>`, metadata insert, compensating object delete on DB error. Add explicit O/M/E handler gate before reading the body; currently session existence is the first check. Retain file validation and no service-role fallback.
- `src/app/admin/content/homepage/hero-upload/route.ts`: start creates a property-scoped hero row and signed upload token; finish downloads original, processes/uploads variants and updates ready state. Already checks O/M/E; preserve that check at start and finish.
- `src/components/admin/HeroImageFields.tsx:75–82`: uploads original using uploadToSignedUrl. Compatibility change described below is required for strict revocation behavior.
- `src/lib/repositories/admin/media.ts`: list/edit/archive/restore use property-scoped metadata; existing F07 reference coverage remains a separate issue. Room/experience/transfer/article/homepage media selectors and public URL readers retain their paths.
- `src/lib/supabase/client.ts` and server.ts: browser/SSR clients must use the actual user's JWT. Do not introduce a Storage service key or reuse another user's session. Read-only local preview still refuses authenticated clients/writes.

## Consolidated model and exact proposed SQL

[F03-media-policy-consolidation.sql.proposed](security-proposals/phase-a/F03-media-policy-consolidation.sql.proposed) is a single proposed transaction. It creates one boolean membership/path helper, replaces precisely the recorded legacy Storage writes with read/insert/update/delete policies, and replaces media_assets legacy+ALL writer policies with explicit role-scoped read/insert/update/delete policies. It preserves media_assets_public_read and public bucket delivery.

The helper accepts only public-media and a canonical lowercase UUID first path segment, denies empty/dot/dotdot segments, repeated slashes, percent/backslash forms and trailing directory names, and compares property_id::text to that prefix without casting untrusted text to UUID. It checks auth.uid against active O/M/E profiles at statement time. Metadata writes must additionally match storage_bucket/file_path prefix to their property_id. UPDATE has both USING and WITH CHECK; another property's source/destination or changing only the metadata property cannot escape the boundary. It does not equate uploader identity with property ownership, so authorized same-property editors can manage team media.

All additional permissive/restrictive policies, grants, inherited roles and bypass-RLS identities must be reviewed before applying this exact delta. Any unexpected policy is NO-GO rather than blindly dropped. Other buckets have no recorded policy to preserve; if fresh inventory reveals them, prepare a reviewed bucket-specific delta. No global revokes on storage schema or service roles are proposed.

The new helper is SECURITY DEFINER solely to read membership safely without recursive profile-policy assumptions; it returns only the caller's authorization boolean. It has fixed qualified references, empty search_path, explicit trusted owner and authenticated-only execution. A trusted owner/schema-grant review remains mandatory. Direct database/table owners and service_role remain privileged bypass identities; ordinary user revocation cannot constrain a leaked service key.

The SQL deliberately requires official operation-aware Storage helpers. The policy permits ordinary upload/upload_update, own-property list/download/info and delete/delete_many; it excludes signing upload URLs, signed upload completion, copy/move, S3 and resumable operations. Those extra methods are not required by inspected current callers and need separate tests/authorization if adopted. [Official Storage operation helpers](https://supabase.com/docs/guides/storage/schema/helper-functions) and the linked [operation definitions](https://github.com/supabase/storage/blob/master/src/http/routes/operations.ts) document the mechanism. Current documentation/master is NOT proof the production server supports it. Verify exact helper signatures, server release/source and operation context in an equivalent isolated Storage deployment; absent support is a blocker, not permission to invent a replacement function or omit the restriction.

## Signed upload tokens: why a policy-only fix is insufficient

Official signed upload URLs can upload without further authentication and are documented as valid for two hours. [createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl). The existing hero flow hands this capability to the client. Revoking active membership afterwards must not be claimed to invalidate a previously issued token. A public bucket also bypasses retrieval access controls; keeping it public intentionally preserves image reads, not draft-photo secrecy. [Bucket access model](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Required compatibility design: hero start returns validated id/path without a signed token; HeroImageFields uploads via authenticated `db.storage.from('public-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'31536000'})`, then calls the existing finish handler. This preserves direct-to-Storage transport without funneling a24 MiB upload through a server request limit. Refresh/expiry/failed transfer handling must be tested; no TUS or extra upload method is assumed. Finish rechecks membership and own-property asset state, verifies original size/type/path, processes variants and checks every cleanup result. Never retry with privileged credentials.

Changing the UI alone is insufficient: an enabled user could call the signing endpoint directly. The proposed operation-aware INSERT policy must deny sign_upload_url as well as exclude unsupported routes. Test actual Storage HTTP behavior; a mocked helper or manually set SQL context is not proof of server enforcement. Existing minted tokens may bypass later checks even with new policy; record the cutover time, stop further issuance at the service policy boundary, and wait the verified maximum outstanding token lifetime plus measured clock/request margin. Two hours is the documented baseline, not a substitute for verifying deployed behavior. Do not rotate project secrets, revoke real users or delete objects to force expiry.

If disabled-user protection must include old capabilities immediately, this design cannot honestly promise that; production remains NO-GO until the capability drain is proven or an independently reviewed platform-supported revocation design exists. Already authorized in-flight requests/transactions can also finish after a membership change. Define the supported guarantee as new authorization checks after the committed disable and after token/in-flight drain; serialize/drain operations during cutover. No disabling test is run on real accounts.

## Synthetic tests and before/after expectations

Fixture properties A/B, distinct O/M/E/S/disabled/non-member users, legacy-email-only user and multi-property user; user JWTs issued only by isolated Auth. Synthetic images for ordinary/hero-original/variant paths, plus existing published and archived metadata, root/unprefixed legacy paths and malformed names. No customer media or accounts copied.

| Test | Before evidence | Required after |
| --- | --- | --- |
| A active owner/manager/editor upload+metadata | Legacy membership may be required | Each succeeds in A using own authenticated token, including a user absent from admin_users |
| Staff/non-member/disabled/legacy-only writes | Legacy branch can permit differing access | INSERT/overwrite/DELETE and metadata writes denied; no object/row side effect |
| Cross-property A→B | Bucket-wide legacy check lacks prefix | Denied on upload/update/delete/read-list; public GET remains public intentionally |
| UPDATE path/property move | Legacy metadata/property behavior differs | Both source and target checked; B prefix/metadata property mismatch rejected; no move/copy grant |
| Malformed prefix/path | No canonical boundary | Root file, bad UUID, uppercase noncanonical prefix, ../, ./, //, backslash, encoded percent, leading/trailing slash fail closed without cast error |
| Ordinary uploads/hero variants/cleanup | Current SDK methods exist | Same-property normal paths work; compensating remove works only for authorized own paths; no privileged fallback |
| New sign-upload request | Existing flow issues capabilities | Denied even when called directly by enabled user; new app uses normal authenticated upload |
| Token minted before policy change | Can outlive membership | Characterize in isolated version; no production revocation guarantee until expiry/drain completed |
| Disable after token issuance | Policy-only evidence insufficient | After verified token/in-flight drain, old user JWT cannot write despite role claims; old signed token cannot complete upload |
| Public image GET | public-media public | Identical stable public URLs/bytes; no new auth requirement, no permission to list arbitrary objects anonymously |
| Direct metadata/table access | Legacy/new policies OR | Same active-role/property restrictions outside app; public published+visible reads preserved |
| Multi-role/multi-property membership | Possible multiple active memberships | Access only properties where role is O/M/E and active; staff membership in B is not upgraded by owner in A |
| Operation/version drift | Unknown current server support | Missing operation context/helper, signing, S3, move/copy/resumable methods deny; expected SDK operations pass |
| Source read/metadata compatibility | Root/unprefixed historical records unknown | Counts-only preflight identifies any affected legacy paths; do not move/delete automatically; stop rollout until safe compatibility decision |

Run real isolated Storage API tests against harmless synthetic raster objects; assert object existence/bytes and metadata after denied operations, not HTTP status alone. SQL-only RLS tests cannot certify object-store/CDN/signed-token behavior. Role disable/fixture creation, upload and removal are future isolated testing permissions, not actions taken here.

## Ordering, interruption, rollback and decision

Verify fresh policy/grant/owner/platform metadata and aggregate legacy-prefix/membership coverage without publishing account identifiers or object contents → prepare/test authenticated hero compatibility → approve an upload-authoring maintenance window → deploy compatibility → atomically replace policies, cutting off new signing → drain outstanding tokens/requests → run approved metadata/public-read verification → reopen media authoring only when the security guarantee is established. A policy timeout/drift failure stops the release; no automatic retry.

Public image delivery should continue throughout because bucket and object URLs are unchanged. Admin upload/edit/cleanup can be unavailable during compatibility/schema-cache/token drain; old hero clients will fail and require refresh. Legacy unprefixed records remain public-readable but may become read-only for edits; NO-GO until a deliberate plan exists. No user is automatically copied from legacy membership into active access. New restrictions may intentionally remove access someone had only through legacy entries.

Keep exact prior definitions/ACLs as recovery evidence, but do not automatically reinstall broad legacy policies. Safe fallback is public-read continuity with media authoring paused, or a forward-corrected active-property policy/application. Rolling back to signed-token-only UI after signing is denied will not work. Database rollback does not undo object bytes, CDN caches, minted tokens or uploads completed during an earlier capability window. Restore/drain procedures must be rehearsed on isolated objects first.

**GO/NO-GO:** NO-GO for production until active-role/path tests, ordinary hero uploads, service operation support, token drain, legacy-object compatibility and recovery all have evidence. No claim of immediate global revocation is made.
