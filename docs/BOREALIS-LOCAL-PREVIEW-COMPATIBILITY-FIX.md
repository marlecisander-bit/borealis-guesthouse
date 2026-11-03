# Borealis local preview compatibility fix

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Both compatibility corrections implemented; offline validation and new isolated build PASS. Website NOT STARTED.** No production request, database/settings change, SQL/migration, Git publication, Netlify or Docker operation occurred. Runtime and visual acceptance remain pending.

## Confirmed causes and installed-framework review

Reviewed installed Next16.3.4 documentation for Proxy/NextRequest and actual NextURL, NextRequest, forwarding-header and start-server implementations. NextURL normalizes numeric loopback hostname to localhost; NextRequest exposes that normalized URL. The previous proxy fed it into the numeric-origin-only route policy, reproducing rejection offline. Next also deliberately assigns process.title=next-server (v16.3.4), invalidating the v3 launcher's mutable command-string comparison.

## Preview-only request correction

Changed src/lib/readonly-preview/policy.ts to add allowedPreviewServerRequest; added src/lib/readonly-preview/server-request.ts to produce the preview NextResponse; changed only the preview branch of src/proxy.ts to call that helper. The existing non-preview production branch and its historical exclusions/auth behavior are unchanged. The existing browser/general route validator still accepts only the numeric origin.

The server exception requires paired flags and the existing trusted preview configuration: exact production URL, isolated build directory, numeric-loopback application origins, no deployment environment and blank privileged integrations. It requires the parsed original HTTP Host header to equal127.0.0.1:3000 exactly. Missing Host, localhost Host, external host, IPv6, alternate port, credentials or comma/duplicate-valued authorities fail closed.

Only the internal URL origins http://127.0.0.1:3000 and http://localhost:3000 qualify, without username/password/hash; both must agree with that exact original numeric Host. The second form is solely Next's internal normalization compatibility. It does not permit browser navigation to arbitrary localhost origins or treat forwarded-host data as the original authority.

Next may itself populate forwarding headers. When present, x-forwarded-host/port/proto/for must respectively equal127.0.0.1:3000,3000,http and127.0.0.1. Conflicting or combined values fail; RFC Forwarded is rejected. An Origin header, if present, must be the exact numeric origin. Matching forwarded values are consistency checks only, never proof of authority. No reverse proxy is authorized by this configuration.

After these checks, only the original approved path/query/method validator runs with the canonical numeric origin. Seven pages, existing assets, query restrictions, GET/HEAD-only access and server-action denial remain unchanged. Cookie/Authorization stripping, anonymous upstream transport, client/service-role refusal, CSP and no-store/noindex headers are preserved. No RPC, Auth, storage, booking, admin, contact or calendar permission was added.

Boundary: validation uses the original Host value exposed by Node/Next, not raw TCP header bytes. Missing or combined ambiguity exposed in that parsed value is rejected. This is a loopback-only sealed-runtime design, not a general reverse-proxy trust configuration or a raw HTTP-parser audit. Host headers are client-supplied; trust comes from the fixed loopback listener/configuration plus strict validation, not from assuming headers authenticate the caller.

## Stable owned-process correction

Created new private v4 launcher.py and ownership.py under .local/readonly-compatibility-v4; v3 remains historical. ownership.py uses macOS libproc metadata for PID, kernel start seconds AND microseconds, process group and executable path, plus the verified working directory and expected current Next process title. Its struct definition was checked against the installed macOS SDK; a read-only self-check against the test process succeeded.

Executable/runtime hash remains sealed. Stable ownership must match all recorded identity fields and the exact Node/source paths, while allowing only the original fixed command or exact expected next-server title. PID/start-time reuse, a different group/executable/cwd or unrelated title rejects. The title is a supplementary check, never the sole identity.

Shutdown rechecks ownership immediately before SIGTERM, targets only that PID, waits for its exit and verifies127.0.0.1:3000 can bind again. It never kills by port/name, never kills an unrelated listener, and does not force-kill automatically if exit/port verification fails. Cleanup remains independent of changed source/environment, while verifying runtime provenance. Startup retains the exact fixed Next start argv, numeric binding, sterile environment, explicit confirmation/browser-review gate, exclusive one-attempt marker and no build/dev/browser/deployment fallback.

## Regression and validation results

| Check | Result |
| --- | --- |
| Complete application suite under Node20/network denial |123 PASS |
| New installed-Next framework cases, included in suite |4 PASS |
| New v4 handoff integrity/tamper/environment cases |8 PASS |
| Stable ownership and mocked shutdown cases |8 PASS |
| ESLint, including final changed test | PASS |
| TypeScript noEmit, incremental disabled | PASS |
| Git diff whitespace and Python syntax | PASS |
| macOS ownership metadata self-check | PASS |
| Full Next16.3.4/Webpack build, Node20.19.5 | PASS,51.1seconds |
| Sealed v4 check without process execution | PASS |
| Website/runtime/visual acceptance | NOT RUN |

Framework tests use the actual installed NextRequest/NextResponse and the exact helper called by Proxy. They cover normalization, original Host, protocols/ports, missing/foreign/combined authorities, forwarded spoofing, unknown paths/queries, mutation methods/server actions, session-header removal, security headers and flags/config rejection. Existing tests verify mocked forbidden upstream requests make zero delegate calls and Auth/service-client restrictions. No live production write function was invoked. Credential-bearing request URLs are rejected by NextRequest construction itself.

Ownership tests mock inspection and signals: expected title change, start-time/microsecond PID reuse, unrelated executable/group/cwd/title, second-check identity swap, safe single-PID termination, occupied port preservation, stuck-process refusal and missing startup token. No application process was spawned by these tests.

## New isolated build and integrity

New source directory:

`/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse/.local/readonly-compatibility-v4/source`

Build directory: that source's `.next-readonly-preview-v1`.
Launcher: `.local/readonly-compatibility-v4/launcher.py`.
Handoff: `.local/readonly-compatibility-v4/handoff.json`.

Source-manifest SHA256: `5c9bcafb4d0ad7e3126e096c06a2ec5b1513eedc8fa4f1916f2327a35182b40c`.
Handoff SHA256: `20e21a42e13f0b6b0ffb3f4792f404de7014cc813071ca002d5e538e33faa957`.
Node executable SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

Prepared317 source files and an independent APFS-cloned dependency tree; no dotenv, Git metadata or old build output was copied. All22,428 dependency entries match the previous verified tree byte-for-byte/internal-link-for-link after build. Paired preview flags1/1, exact public URL/key, numeric origins and isolated distDir were supplied through a sterile child environment. Build used sandbox-exec deny network* for the process tree; no production/font connection could be dispatched, including during prerendering. No exception for unreviewed reads or fonts was introduced. All displayed app routes are dynamic/on-demand; their presence in the build route list is not preview permission.

Both Manrope/Cormorant local font binaries match emitted assets. No public key occurs in source files; its expected compiled JavaScript presence was verified privately and bound by fingerprint. No privileged integration credential was supplied. Logs were sanitized before persistence. Expected compiler-only source changes to tsconfig.json/next-env.d.ts are recorded in pre/post manifests, without changing their canonical counterparts.

All500 generated build artifact paths/hashes,317 post-build source files and22,428 dependency entries were verified by the sealed v4 check and handoff regression. The seal also binds the ownership helper, receipt and manifests. Fresh runtime HOME/TMPDIR are reserved separately from build directories. No v4 attempt/process record exists. Previous v2 build, v3 launcher/seals and its consumed attempt/process evidence remain untouched; no consumed marker was reset.

## Remaining limits and exact next authorization

The local compatibility blockers are resolved in framework/offline tests and compile successfully. Actual listener initialization, real header/CMS behavior, browser fonts/layout and complete request-path coverage still require a controlled runtime attempt. Remote images remain intentionally blocked, and public-reader errors may show fallback content. No allowlist should be expanded automatically. App containment is not a host-wide firewall or database read-only role. Node20.19.5 remains the requested compatibility runtime and is EOL; no Netlify/system runtime setting changed.

Exact next authorization: ONE controlled read-only startup using only the v4 launcher/handoff and token START_VERIFIED_READONLY_COMPAT_V4_ONCE, fixed127.0.0.1:3000, paired flags and all preflight checks. Use a newly created session-free isolated Chrome instance for owner manual visual acceptance; no extension or automation connection is required. Permit only the seven approved informational pages/public CMS projections, local HTTP/header/font checks and synthetic/intercepted forbidden-request tests. Stop immediately on any security/config/binding failure without retry or fallback. After successful technical checks, wait for owner observations, then perform stable ownership-checked shutdown and verify port release.

No website startup is included in this preparation task. No production changes, SQL/migrations, real mutation tests, Git publication, Netlify or Docker operations are authorized by this report.
