# Borealis F03 — application compatibility result

21 October 2026, Europe/Tirane. Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Local compatibility implementation and offline validation PASS. Production GO/NO-GO: NO-GO.** No SQL/policy, live Storage upload/delete, Auth account, production media, Git publication, Netlify deployment/configuration, Docker or infrastructure change occurred. No application server or production browser test was started. `.env.local` was not changed. Existing deployed signed-upload behavior remains untouched because nothing was published or deployed.

## Exact source changes

| File | Local change |
| --- | --- |
| `src/app/admin/media/upload/route.ts` | Explicit O/M/E and canonical identity gate before body parsing; retain user SSR upload and 4 MiB request cap; use bounded signature detector, canonicalize supplied UUID; sanitize provider errors; check compensation failure |
| `src/app/admin/content/homepage/hero-upload/route.ts` | Start returns id/propertyId/path without issuing a signed token; finish verifies own property, canonical source path, size and detected MIME before processing; enforce variant size/type; check derivative cleanup and acknowledged pending-state recovery |
| `src/components/admin/HeroImageFields.tsx` | Replace uploadToSignedUrl with the authenticated upload helper; retain start/upload/finish sequence, progress, expiry errors and finish retry; show 10 MiB maximum |
| `src/lib/hero-original-upload.ts` — new | Validate server-issued id/property/path against kind and MIME; verify current Auth user and active O/M/E membership for the returned property; ordinary `upload` with upsert:false using the existing browser client |
| `src/lib/media-upload-security.ts` — new | Shared canonical UUID/role gate, exact hero original path constructor, size check and bounded JPEG/PNG/WebP/AVIF signature detection; no server-only runtime import in the browser bundle |
| `src/lib/hero-image-config.ts` | Hero maxBytes becomes 10 × 1024 × 1024, matching the existing bucket |
| `src/lib/hero-image-processing.ts` | Match rejection copy to 10 MiB; processing algorithm, quality, ICC handling, widths, orientation and original preservation unchanged |
| `tests/hero-upload-route.test.ts` | Update existing initiation regression from signing to id/path/no-token contract; use valid synthetic user identity |
| `tests/storage-compatibility.test.ts` — new | Seventeen synthetic client/route/auth/policy-model/public-URL regressions |

No Supabase client implementation, metadata repository, public media URL reader, F01 file, F02 SQL/helper, dependency, lockfile, font asset/license or development-preview safeguard was modified. Pre-task byte inventory confirms every unrelated existing file is unchanged. No service-role client/key, signed-upload fallback or alternate user's session was introduced. The new browser helper imports auth types only through erased TypeScript imports.

Private focused diff: `.local/f03-application-compatibility-v1/F03-application-compatibility-v1.patch`, SHA-256 `4b35aa275bad56929844fecb5e35f8fa1901d32ab1e10795e55980798d3bba33`. Exact nine-file hashes: adjacent `source-manifest.json`, SHA-256 `9f4ac80472d0aa1f76382d5220644c3832e5259b2ab2d14270a1b700545e04e4`. This diff is relative to pre-task files, so it does not mix in historical F01/preview changes. Private evidence remains ignored; staging remains empty.

## Existing versus proposed behavior

| Stage | Existing deployed behavior | Local proposed behavior |
| --- | --- | --- |
| Ordinary Media Library | SSR user upload; session presence gate | Same SSR transport plus explicit O/M/E gate and checked compensation |
| Hero start | Insert pending hero metadata and mint signed upload token | Insert same property-scoped pending metadata; return id/propertyId/path only |
| Hero original | Browser uploadToSignedUrl with capability | Existing browser user's ordinary authenticated `.upload(path,file,{upsert:false,contentType:file.type,cacheControl:'31536000'})` |
| Hero finish | Reauthorize, download original, process/upload variants, mark ready | Same flow with exact path/size/type checks and visible cleanup/reset failures |
| Public images | Stable public-media URLs | Same bucket, paths, URL resolver and published readers |

The server ignores a caller-supplied property and constructs originals as `<session property UUID>/hero/<kind>/<new UUID>/original/source.<ext>`. Ordinary object paths remain `<session property UUID>/<asset UUID>.<ext>`; metadata property/uploader values come from the trusted session. Finish queries id plus session property, then checks pending source identity before touching Storage. All incomplete derivative paths are generated under that same hero identity and an attempt UUID.

`getCurrentAdmin()` already calls Auth getUser and reads an active admin_profiles membership; both start and finish call it independently. The added server gate permits owner/manager/editor only. Immediately before browser transfer, the helper checks the current user's active role/property membership, rejects malformed/mismatched paths, and then uses that user's normal Storage session. Disabled/non-member/expired test cases are synthetic; current client-side checks cannot prevent direct API calls or revoke a request already authorized. **Real database/Storage policies remain the security authority.** No immediate global revocation claim is made.

## Size, MIME and processing policy

Hero selection, initiation, original processing and each variant now have a **10 MiB (10,485,760 bytes)** maximum, minimum 1 byte, with JPEG/PNG/WebP/AVIF only. Production bucket settings are unchanged. The ordinary multipart route keeps its stricter **4 MiB** cap for the existing hosted request-size budget; the Media Library's separate source optimization settings remain unchanged. No 24 MiB promise remains in the edited hero flow. Already-ready assets are returned without recompression; oversized pending originals are rejected for new processing, not deleted.

Hero processing still decodes real raster bytes with sharp, rejects unsupported/animated content, preserves source bytes, limits 60 megapixels, applies EXIF orientation, derives each variant directly from the original, retains quality 93/widths and public URLs. Before decoding, detected MIME must agree with the source path extension. Ordinary upload retains its existing signature-based acceptance, now requiring complete signature length; a truncated PNG prefix no longer passes the header detector. This is not a new full raster-decoding guarantee for ordinary uploads.

On a failed derivative upload or ready-state save, only successfully acknowledged derivatives from that attempt are submitted for removal; the original is retained. Cleanup error/exception or missing/error pending reset returns an explicit incomplete-recovery message. The pending reset checks a returned id and processing state, so a zero-row authorization/concurrency result is not reported as successful recovery. Ordinary metadata-save failure similarly checks object compensation and surfaces cleanup failure. No privileged retry occurs if membership expires. Ambiguous network outcomes, interrupted requests and unacknowledged uploads can still leave pending metadata/orphan bytes; no destructive automatic sweep was added.

## Offline validation

Read the development baseline/priorities, F03 plan, Phase A design and roadmap; reviewed the unchanged F03 SQL text. Read installed Next16 Route Handler guidance before editing. Tests use actual patched adapters/handlers with mocked Auth, membership, query and Storage responses plus synthetic raster processing. **No real Storage write, deletion, login, profile creation or policy execution occurred.**

| Check | Result |
| --- | --- |
| Focused Storage/hero routes and actual image-processing suite | **25/25 PASS** |
| Full canonical unit suite, including F01/F02 compatibility mocks | **162/162 PASS**, zero failed/skipped |
| TypeScript noEmit / ESLint | **PASS** |
| Clean production-style Next16.3.4 Webpack build | **PASS**, Node20.19.5; OS deny network* |
| Final build integrity | **503 artifact hashes rechecked**, no mismatch |
| Dependency integrity | **22,428 file/link entries identical** canonical/clone before/after; no install/update |
| Credentials / production flags | Sterile build environment, no privileged/provider credentials or preview flags supplied; no dotenv copied |
| Unrelated source / F01 proposals and evidence | Preserved byte-for-byte by pre-task inventory |
| PostgreSQL/Storage RLS and real signing/token behavior | **NOT TESTED** |
| Deployed image bytes/cache continuity, browser transport/session refresh | **NOT TESTED** |

New tests cover authorized O/M/E upload paths; staff/disabled/nonmember/expired denial; cross-property metadata/path denial; malformed paths and unsupported/oversized/truncated files; session-property metadata ownership; hero token-free initiation; normal upload without privileged retry; derivative success/failure/reset/cleanup; ordinary upload success/compensation; public URL contract; and proposed INSERT-operation restriction. The signing test checks the exact SQL's ordinary-upload-only predicate plus a clearly labelled local model. It does **not** prove the Storage server sets operation context or denies signing HTTP requests.

Final evidence: `.local/safe-checks-20261021T103202007014Z/`, completed **10:33:21 UTC**. Build-artifact manifest SHA-256 `c8b653366d8f954c493fb50f807f82f43a65030ef56e9d5277f485658fd26a35`. An earlier full run was superseded by the final cleanup-check edit; its source-stability guard rejected reuse. The final run above had stable source throughout and all checks passed. Existing Node20/Supabase deprecation warnings remain runtime-maintenance work, not silently changed dependencies.

The build validates the current canonical tree with its pre-existing local safeguards and F01 preparation patch. It is not a clean deployed-main candidate or live-content acceptance. This F03 patch adds no preview-only imports/flags/behavior; a future source-only release must deliberately compose the reviewed F01/F03 patches and exclude historical preview-only modifications. Prior minimal F01 candidate snapshots remain unchanged and independently inventoried.

## Remaining policy dependencies and deployment ordering

F03 SQL remains unchanged/unexecuted, SHA-256 `c37193538e29df1f67a0a1fecbeba87209b40584f7b4bc08cef1c3f07febf217`. Legacy admin_users-based permissive branches still require separate consolidation; changing application calls cannot deny a direct SDK signing request. Before rollout, independently verify current policy/grant/helper/owner drift, exact Storage version and real operation-context behavior, active role/property RLS, metadata scope, normal upload/download/delete support, and legacy unprefixed object compatibility. Do not invent operation helpers or relax restrictions to make a test pass.

Future ordering, **not executed or authorized here**:

1. Review the final source-only release set and SQL delta, existing recovery evidence/limitations, legacy paths and a bounded synthetic HTTP test plan on the selected existing platform.
2. Separately authorize a media-authoring maintenance window; keep public image reads available. Confirm ordinary authenticated hero uploads and the exact required SDK operations can work with the proposed policies before reopening authoring.
3. Deploy the reviewed compatible app while authoring stays paused. Apply separately authorized policy consolidation to stop new signing at the service boundary. Old loaded hero clients need refresh; do not roll back to signed-only UI after signing is denied.
4. Verify actual direct sign-upload denial and normal own-property uploads/metadata/download/cleanup; drain all previously minted capabilities for the verified maximum lifetime plus measured clock/request margin, and drain in-flight authorizations. Do not assert policy/application deployment instantly invalidates old signed tokens.
5. Verify denied operations have no object/metadata side effects, public URL/byte continuity, disabled/cross-property isolation and recoverability, then reopen authoring only after acceptance. Preserve public-read continuity and forward-fix/keep authoring paused on failure; do not automatically restore broad legacy permissions.

**GO: local review and continued offline development. NO-GO: production F03 deployment/security-completion claim.** Real policy/API/role/token tests, legacy compatibility, signed capability/in-flight drain and recovery/deployment gates remain outstanding. No automatic next stage follows this report.
