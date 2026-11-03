# Borealis cache isolation and running local preview

2026-10-20 (Europe/Tirane). **Cache correction, offline validation and controlled startup PASS. Website RUNNING at http://127.0.0.1:3000; keep running until the owner explicitly requests shutdown.** No rebuild, production modification, SQL/migration, real mutation test, Git publication, Netlify or Docker operation occurred.

## Historical cache investigation

Installed Next16.3.4 filesystem-cache implementation explicitly stores FETCH data under distDir/cache/fetch-cache. Its unstable_cache implementation uses a serialized JSON result with an empty URL and empty headers; the historical file matches that envelope. File birth/modification timestamps fall between the prior preview preflight and finalization. This strongly supports creation during that preview; no original writer trace was collected, so exact call-site attribution is not claimed.

Privately inspected the367-byte JSON cache without displaying its content. No current public key, secret-key prefix, JWT-shaped value, Set-Cookie header, exact credential/guest-identity field name or email-shaped value was detected. A broader field-name heuristic matched a booking-related term, which alone does not establish private guest data. This is a bounded inspection, not a guarantee against every possible sensitive string; the cache continues to be treated as private application data. It was not copied into the new runtime or deleted.

Historical cache SHA256 remains8783344f1a6a4a24b966d1f280d629abe89acf5712eb3d7c71328836657953b0. All500 original recorded artifacts retain their hashes. Its extra data file invalidated exact whole-directory equality, but did not alter an executable/compiled artifact. Existing receipts and consumed markers remain unchanged.

Next's default cache writes to disk when flushToDisk is enabled. A custom cacheHandler is documented, but would change application configuration/rebuild scope. No cache-location environment variable was invented. Instead the existing verified build bytes were copied into a new runtime workspace, leaving a fresh FETCH cache in the installed version's expected location. No application source/configuration change or compilation was needed.

## Versioned runtime and immutable separation

New launcher: `.local/readonly-v4-runtime-v6/launcher.py`.
Verified runtime source: `.local/readonly-v4-runtime-v6/source`.
Build: source/.next-readonly-preview-v1.
Handoff SHA256: b4fcb364c44d870e3dd127e14a098972e87601dd6818ee814e210c60a2f246f4.
Runtime PID: 18255.

The runtime source has the exact317 post-build source bytes; dependencies are an independent APFS clone of the verified22,428 entries. Only the500 manifest-recorded build files were cloned, preserving each path/hash. Historical mutable cache was excluded. No prior source/build/cache/receipt was edited.

In the new copy, immutable compiled files are read-only and compiled directories read/traverse-only. Only the explicitly reviewed cache/fetch-cache directory is writable. No symlink redirects cache access into another location. Node's new child inherits task-local umask077, so newly created cache files/directories are private. These permissions are accidental-write protection for this trusted-user workflow, not a sandbox against a malicious owner who can chmod their own files.

cache_policy.py verifies all500 immutable paths and SHA256 values; extra executable/configuration/compiled files remain rejected. Only one level of64-lowercase-hex-named entries under cache/fetch-cache may vary. Symlinks, traversal, unexpected directories/types, wrong owner, hard-linked mutable files, executable or group/other-accessible cache files, unsafe permissions and oversized entries fail closed. Cache entries must match the reviewed JSON FETCH/unstable_cache envelope: successful status, empty URL/headers, parseable JSON body and bounded tags. It does not accept arbitrary files or serialized code. No new request/route/storage/RPC permission was added.

Validation occurs before startup and after the technical requests; this is not a claim of continuous filesystem/network monitoring. The cache is private runtime data, never imported as executable code. Compiled-directory permissions further prevent ordinary Next cache writes outside the reviewed location.

## Shutdown safety and offline results

Retained the tested v5 correction: PID/kernel start seconds+microseconds, process group, executable and source cwd match; expected Next title changes are allowed. An already-exited process or disappearance during inspection counts as stopped only after PID absence and port release are checked. Live PID metadata failure, reuse, changed identity, unrelated listener or failed port release rejects without killing a different process. Only the owned PID receives SIGTERM; no forced kill or broad process-name/port cleanup occurs.

PASS:123 full application/framework tests under Node20 with OS network denial;9 cache/integrity tests;13 mocked shutdown/ownership tests. Cache cases cover500-file equality, expected cache acceptance, extra executable/config rejection, symlink/traversal/type/permission rejection, missing/tampered artifacts, historical receipt/cache preservation and no unauthorized process creation. Full handoff check passed against the real new runtime copy. No test called a live production mutation endpoint.

## Preflight and running results

Node executable reported20.19.5 and matches the recorded verified binary hash. Paired flags1/1, exact approved production URL/public key and blank privileged integrations were passed only through the sterile runtime environment. Metadata-only Auth settings GET returnedHTTP200; no credential or body was logged. No inherited cloud/deployment/proxy variables entered the application. Port3000 was free before the single new attempt.

A newly created empty task-owned Chrome user-data directory under this v6 preparation was used, with sync/extensions disabled, no imports/sign-ins by the task and no remote debugging. Existing profiles were not read, cleared or reused. The homepage was requested in that exact new instance after successful HTTP verification. Actual visual inspection remains manual, not an automated screenshot/console claim.

Stable process ownership and process-scoped lsof confirm only127.0.0.1:3000 is listening for the task-owned server, with no wildcard/IPv6 listener. All seven approved routes returnedHTTP200 with HTML, expected CSP/no-store/noindex, no redirect and no Set-Cookie: /, /about, /rooms, /experiences, /transfers, /explore-koman, /gallery. Both local font responses matched the immutable sealed bytes. Post-request validation verified all500 artifacts and 1 valid private runtime cache entries.

No real booking/admin/contact/Auth/calendar/storage mutation was requested. Upstream restrictions are enforced by the unchanged reviewed application guard; no independent packet-level traffic trace was collected. These checks do not certify every possible native networking path or prove CMS content completeness versus fallback data. Remote images and the image optimizer remain intentionally blocked; missing images are expected and were not fixed by loosening policy.

## Running handoff

The site is available for owner browsing at http://127.0.0.1:3000. Leave it running until an explicit owner stop request. Do not reset this version's consumed marker or auto-restart on failure. Later stop only through this version's recorded stable ownership and port-release checks. Preserve all private diagnostics under the v6 directory. Source, original build, historical data and production remain unchanged.
