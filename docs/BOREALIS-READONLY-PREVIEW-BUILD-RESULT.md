# Borealis read-only preview build result

2026-10-20 (Europe/Tirane). Canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Font integration, offline validation and full production-style build PASS. Website NOT STARTED.** Next16.3.4 built successfully under isolated Node20.19.5 with the paired read-only preview flags and OS-enforced denial of all networking. No production Supabase request or mutation could be dispatched by the sandboxed build process tree. No production-connected browser test, SQL, migration, Auth edit, deployment, Netlify edit or Docker operation occurred.

This supersedes the previous font-blocked result. Its full text is preserved privately at `.local/readonly-font-build-v2/previous-build-preparation-report.md`; older source/runtime/controller snapshots were not overwritten.

## Runtime and workspace

Canonical branch main, HEAD745b4aa56589cda5e5d0c8823ccc1cabb055e313. Existing preview source changes/reports were preserved. This task changes only the two font-loader declarations/import in src/app/layout.tsx, adds the two families' assets/notices/metadata/provenance and adds two offline font tests. Existing booking, CMS, admin, preview-policy and proxy source behavior was not modified. No commit or push occurred.

Node20.19.5 ARM64 and npm10.8.2 remain isolated under `.local/readonly-build-v1/node-v20.19.5-darwin-arm64`; system Node24.21.0 is unchanged. The official archive SHA256 remains cfed7503d8d99fbcf2f52e408ec52f616058eb0867b34dbc3437259993ef5cba, previously verified against the [official release checksums](https://nodejs.org/download/release/v20.19.5/SHASUMS256.txt). Existing lockfile/dependencies were reused without package installation or update. Prior native Sharp/SWC and offline dependency-tree checks passed; those were not rerun unnecessarily.

Node20 is EOL according to the [official support table](https://nodejs.org/en/about/previous-releases). This exact runtime matches the requested Netlify compatibility target and is not a recommendation to keep an unsupported production runtime. Netlify's version configuration was not changed.

Actual VS Code open-folder root remains independently unconfirmed; IDE open-file paths are canonical and every task command used the canonical directory explicitly. Confirm folder selection before eventual launch; no workspace switch was performed.

## Official font provenance and license verification

Repository: https://github.com/google/fonts. Pinned commit:47d54ca1ebb14fd864695f1d39dc734f39017c33. Only ofl/manrope and ofl/cormorantgaramond files were downloaded from that official repository through GitHub/raw.githubusercontent.com. No fonts.googleapis.com, fonts.gstatic.com, mirror or unrelated asset was requested.

License text and METADATA.pb were inspected before binary acquisition. Both families declare OFL; full SIL Open Font License1.1 texts and copyright notices are retained unmodified alongside the binaries. Font binaries were not edited, renamed internally or subsetted. Download bytes were checked against the GitHub contents API's Git blob digest at the pinned commit; SHA256 values are recorded below and in src/app/fonts/provenance.json. This establishes pinned-source/file integrity, not a third-party font security certification.

Binary SFNT/name/fvar tables were inspected independently of filenames. Manrope identifies as Manrope, normal, wght200–800. Cormorant identifies as Cormorant Garamond, normal, wght300–700. Metadata confirms Latin coverage. Official Cormorant metadata also offers a separate italic asset; it was not downloaded because the original application requested only normal faces. Existing CSS-synthesized italics remain as before; no new real-italic face or unrelated style was introduced.

| File under src/app/fonts | Bytes | SHA256 |
| --- | --- | --- |
| manrope/OFL.txt | 4387 | `58172e0c0fac2cda8a37b348164bb55e44b0e69051e557e92b1d3f6910141f7b` |
| manrope/METADATA.pb | 732 | `fb204147a7c16d009d4fa53248b6075bc941d7adfa450a825bc5d4cef2f9ded9` |
| manrope/Manrope[wght].ttf | 164700 | `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6` |
| cormorantgaramond/OFL.txt | 4387 | `60700d351cac4650c51f3f9db318d2a420f8b45052dba2715eb5fec41f0f6956` |
| cormorantgaramond/METADATA.pb | 1426 | `faa16a5e79613ca7cadd599ada1f4cf6891f3cb6731631fbed2a0b18a342e556` |
| cormorantgaramond/CormorantGaramond[wght].ttf | 1195560 | `b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0` |

Exact pinned download URLs and Git blob digests are retained in [font provenance](../src/app/fonts/provenance.json); family sources are [Manrope](https://github.com/google/fonts/tree/47d54ca1ebb14fd864695f1d39dc734f39017c33/ofl/manrope) and [Cormorant Garamond](https://github.com/google/fonts/tree/47d54ca1ebb14fd864695f1d39dc734f39017c33/ofl/cormorantgaramond). Retain the two OFL notices with any later distribution; no publication is authorized here.

## Exact loader changes

src/app/layout.tsx now imports localFont from next/font/local instead of the two next/font/google functions.

- Manrope loads the official Manrope[wght].ttf with weight200 800, normal style, display swap, existing --font-manrope variable and Arial fallback adjustment.
- Cormorant Garamond uses the one official variable TTF through three normal-face descriptors for400,500,600, display swap, existing --font-cormorant variable and Times New Roman fallback adjustment. Only the original requested weights are exposed by those declarations.
- Existing html classes, CSS, family use, font sizes, layout, colors and application functionality remain unchanged. Default preload behavior is retained. No Google runtime requests or build downloads are required by these loaders.

Installed Next16.3.4 local-font documentation and fallback implementations were reviewed. Explicit serif/sans fallback categories avoid accidentally changing Cormorant to an Arial fallback when switching loaders.

## Isolated build and network controls

Prepared a new `.local/readonly-font-build-v2/source` snapshot with the local fonts and a separate APFS-cloned dependency tree. Previous readonly-build-v1 and readonly-preview-v1 snapshots/seals remain historical. No dotenv, Git metadata or old build output was copied. The public key was supplied privately only through a sterile allowlisted child environment; privileged integrations, cloud/deployment tokens, proxy configuration and Node preload settings were not inherited.

Paired BOREALIS_READONLY_PREVIEW=1 and NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW=1, exact approved Supabase URL, localhost origins127.0.0.1:3000 and NEXT_DIST_DIR=.next-readonly-preview-v1 were supplied. The reviewed guard files were hashed against the previous sealed source and matched before compilation.

Executed exactly one complete `next build --webpack`, a supported installed-CLI compiler option, using Node20.19.5 under macOS sandbox-exec with deny network*. This is a production-style Webpack build, not a Turbopack or dev-server acceptance test. No local listener exception or network relaxation was introduced. The sandbox was per process and descendants, not a global host/Docker firewall change.

Build exit0, elapsed50.0seconds, BUILD_ID present. All displayed application routes are dynamic/on-demand; Proxy compiled. No app server or browser was started. The application’s route table still lists blocked APIs/admin/booking routes because the source includes them; listing them in a build is not runtime permission. The preview proxy must still enforce its allowlist during separately authorized startup.

No outbound production/font HTTP connection could be dispatched by the network-denied build, including writes. This does not claim an absence of attempted reads internally or prove production content completeness: an attempted read may fail or be handled by application fallback. No live content was used as evidence of success. Build-time containment plus compiled guard presence does not certify runtime hook execution before startup.

## Build output and safeguard verification

Emitted exactly two local TTF files; their SHA256 set equals the two downloaded input binaries. Generated CSS contains --font-manrope and --font-cormorant and no fonts.googleapis.com/fonts.gstatic.com references. Browser font URLs are local /_next/static/media paths allowed by the existing preview asset policy. Existing restrictions on remote images, APIs, Auth and mutation paths were not loosened.

Compiled output contains the route-rejection, browser-request, browser-client, service-client and server read-policy guard markers. Server instrumentation and Proxy artifacts exist. No runtime acceptance claim is made from string presence alone.

Next automatically changed only these source-input files inside the isolated build snapshot:

- tsconfig.json: added the isolated preview types/dev-types directories to include.
- next-env.d.ts: changed route/root-params type references from the old Playwright output to the isolated production-build types.

Canonical versions were not changed. Before and after source manifests record this expected compiler-generated delta rather than silently pretending byte identity. No preview guard changed. The build has500 hashed output files and a private build-validation-receipt.json bound to the post-build source/runtime, with accepted_for_startup=false and website_started=false. Build logs were sanitized for key/JWT values and kept mode600; no key or raw service/HTTP response body was printed.

The intended NEXT_PUBLIC public key may occur in client bundles by design; it is not a service-role secret or a read-only credential. The sterile environment supplied no privileged secret. Build output is private and uncommitted. Do not publish it or treat the local preview as database-level read-only protection outside its reviewed application boundary.

## Validation results

| Check | Result |
| --- | --- |
| Pinned official license/metadata/Git blob/SHA256 | PASS |
| Binary family identity/style/weight axes | PASS |
| Font bytes emitted by Next match sources | PASS |
| Existing plus two new unit tests on Node20 |119 PASS,0 FAIL |
| ESLint on Node20 | PASS |
| TypeScript noEmit, incremental disabled, Node20 | PASS |
| Git diff whitespace | PASS |
| Full Next16.3.4 production-style Webpack build | PASS, exit0 |
| External font dependency during build | None required; all networking denied |
| Production HTTP/mutation dispatch during build | Blocked by OS network denial |
| Compiled preview policy/route/client guard artifacts | Present |
| Actual runtime guard/listener/CSP/browser behavior | NOT RUN |
| Website startup | NOT RUN |

Unit, lint and TypeScript checks also ran under per-process network denial. Font tests verify retained notice/file checksums, pinned source paths and loader variables/weights/styles. Existing tests remain synthetic/mocked; no production mutation test or live booking/contact/admin/Auth operation was invoked.

## Visual-equivalence limits

The same families, requested weights/styles, CSS variables and swap/preload intent are preserved. No CSS/layout redesign occurred. Pixel-identical rendering has not been demonstrated because website/browser startup was prohibited. Pinned upstream font revisions may differ from whatever Google CSS would serve later; local versus Google fallback-metric calculations can differ transiently before font load. Explicit Arial/Times fallback categories preserve the intended categories, not an assertion of identical calculated metrics.

Full upstream variable TTFs include more glyph coverage and are larger than Google-served Latin WOFF2 subsets: Manrope164700bytes and Cormorant1195560bytes before transfer compression. No unverified subsetting/conversion was performed. Any later optimization must preserve license, axes/glyphs and appearance through separate validation. Existing synthetic italics remain synthetic, matching the original normal-only loader configuration.

## Remaining blockers and next authorization

The font/full-build blocker is resolved. Startup remains a separate reviewed operation. The older launcher points to the older snapshot and deliberately blocks its own build path; do not run it against stale fonts or manufacture an accepted receipt. A startup handoff must explicitly target this successful readonly-font-build-v2 build, validate its manifests/expected compiler deltas and confirm a clean environment, canonical folder, free loopback port, fresh browser profile, actual guard initialization and ownership-checked shutdown on failure.

Exact next scope: authorize preparation/use of a receipt-aware startup handoff for this successful build and ONE read-only local preview attempt on127.0.0.1:3000, with the paired flags, existing production public key, reviewed public informational reads only, fresh browser profile and fail-closed runtime/blocked-request verification. Recheck owned process cleanup and stop immediately on any guard/binding/request discrepancy; no automatic retry or normal-mode fallback. This document itself grants no startup authorization.

No booking/contact/admin/auth/calendar/storage mutation or personal-data-page test, SQL/migration, production Auth edit, Git commit/push/merge/deployment, Netlify change or Docker operation is included. Production .env.local and all production configuration were preserved. No website started.
