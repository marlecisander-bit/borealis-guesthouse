# Borealis verified build launcher handoff

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Preparation and offline verification PASS. Website NOT STARTED; runtime acceptance remains NOT RUN.** Created a new versioned launcher without changing application source, production environment, historical snapshots, build artifacts or receipts. No rebuild, production request, SQL, migration, Auth change, Git publication, Netlify operation or Docker operation occurred.

## Exact build selection and integrity

- Source: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse/.local/readonly-font-build-v2/source`.
- Build: the source directory's `.next-readonly-preview-v1` output.
- Historical evidence: `.local/readonly-font-build-v2/build-validation-receipt.json`; exit0, Next16.3.4/Webpack, Node20.19.5, paired preview flags1/1 and build-time denial of all networking.
- Post-build source-manifest SHA256: `1ecfd5cfed83085e5617cdedb67674707637279b05104057ae3358801a26aac2`.
- Node executable SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

Verified every source-manifest file and the exact source file set, all500 output artifacts and their exact file set, and22,428 dependency entries including internal symlink targets. Missing, added, altered or linked build artifacts are rejected. Source symlinks, unexpected dotenv and stale root .next directories are rejected. Only tsconfig.json and next-env.d.ts differ between the pre/post-build source manifests, matching the previously documented compiler-generated changes. The handoff uses the post-build manifest rather than hiding those differences.

Node binary matches the successful build receipt; its retained version header declares20.19.5. No Node executable was run in this preparation. Its existing successful Next build establishes the recorded compatibility result. Node20 remains EOL; no system/runtime installation or Netlify version change was performed.

Both local TTFs match the emitted font binaries. Manrope and Cormorant Garamond retain the reviewed next/font/local declarations, license notices and pinned provenance. No font download or visual test occurred in this task.

## Corrected versioned launcher

New private directory: `.local/readonly-launcher-handoff-v3`.

- launcher.py: check, explicitly authorized start and ownership-checked stop operations only. No build, dev, Git, deployment or browser-launch operation exists.
- handoff.json: exact source/build paths, launcher hash, Node hash, historical receipt/manifests/build-intent hashes, dependency-manifest hash and private public-key fingerprint.
- dependencies.json: exact dependency file hashes/internal link targets for this successful snapshot.
- test_launcher.py and offline-validation.json: process-mocked validation and sanitized results.
- Empty owner-only home, tmp and browser-profile directories reserved for later review. Merely creating an empty profile directory does not establish that a browser actually uses it.

The old launcher hardcoded readonly-build-v1/source and its absent build-receipt.json. It was preserved unchanged. The successful build receipt still says accepted_for_startup=false; it was not rewritten or represented as runtime-accepted. The new handoff separately establishes artifact eligibility for a future explicitly authorized attempt. Its own status remains offline-only/runtime-not-accepted.

Handoff configuration SHA256: `bd07397dc731caa1df78a70ca936df7a365f62b0593760b1863acfc462d0c10f`.

## Runtime configuration and credential boundary

The launcher rejects unexpected parent environment names, including cloud, deployment, proxy, Node preload and credential variables. Both preview flags must explicitly equal1 in the caller environment. A small explicit set of shell/locale/macOS Python-injected toolchain names is permitted but never forwarded to Node. An initial sterile CLI check exposed those macOS-injected names; the final allowlist accounts for them without permitting cloud/deployment variables.

Canonical .env.local is read explicitly as a configuration input; dotenv is never automatically inherited by the isolated source. Duplicate assignments and a wrong project URL fail. Only its exact approved production public URL and publishable key are selected; all privileged integration fields must remain blank. Runtime key fingerprint is bound privately to the current key, whose exact bytes were found in compiled JavaScript. That establishes association with this build; no live Auth settings request was made and publishable-key syntax alone does not prove project membership. Historical HTTP200 verification remains the earlier evidence.

No key value or response body was printed. The public key's expected compiled presence is not a privileged-secret leak. Prior build evidence records no privileged credentials supplied. This task does not claim an exhaustive independent secret audit of arbitrary binaries or historical files.

The child receives a newly constructed environment: isolated Node PATH/HOME/TMPDIR, production mode, telemetry off, paired flags1/1, exact NEXT_DIST_DIR, approved URL/key, blank privileged integrations and exact127.0.0.1:3000 origins. No caller cookies, browser storage, service key, cloud credentials or canonical dotenv is copied. There is no normal-mode fallback.

The only startup argv is the isolated Node executable, this snapshot's Next CLI, then `start --hostname 127.0.0.1 --port 3000`. Startup checks the available IPv4 loopback port, consumes an exclusive one-attempt marker and records PID, start-time/argv identity and process-group ownership in owner-only files. Failed process recording triggers cleanup of the newly created child. Stop rechecks recorded argv/start identity/process group before requesting SIGTERM; it does not kill by port or process name. SIGTERM request alone is not proof of exit, so the authorized operator must verify termination and listener removal. Automatic retries are prohibited.

Startup additionally requires the fixed confirmation token and an explicit fresh-browser-review assertion. No browser opens automatically. This assertion is an operator gate, not technical proof of browser-profile isolation; a real clean browser profile and absence of production sessions remain mandatory future checks.

## Safeguards and offline tests

Nine canonical/snapshot guard files match byte-for-byte: server/browser instrumentation, proxy, read policy/contract and the Supabase browser/server/service/transport clients. Their recorded hashes are checked before startup. Existing route, projection, cookie/session, Auth, RPC, storage and mutation restrictions were not changed. Build-artifact identity preserves their compiled output; actual framework hook execution requires runtime acceptance.

PASS:10 offline Python tests. Covered valid build selection without executing a process; exact source and Node identity; old-snapshot rejection; missing/extra/tampered artifacts; paired flags; wrong endpoint, duplicate keys and privileged configuration; unexpected parent/deployment/cloud/proxy variables; exact loopback argv/child environment; explicit startup/browser gate; mocked one-attempt process recording; PID-reuse rejection during mocked cleanup. All process creation and termination in startup/cleanup tests were mocked. The real check operation performs file verification only and passed with website_started=false. No attempt.json or process.json was created in this handoff directory.

No application tests or full build needed rerunning because application/dependency/build bytes were unchanged. Previous119 unit tests, lint, TypeScript and successful build remain historical validation, not a new runtime test. No production-connected browser or mutation endpoint was exercised.

## Remaining blockers and exact next scope

Actual VS Code open-folder root, a real fresh browser profile, current key validity, loopback binding, runtime guard initialization, CSP/session behavior and desktop/mobile rendering remain unverified. The launcher prevents ordinary accidental publication through its fixed command/environment; it does not prevent another host process or the owner from using separate Git/deployment credentials. Application guards are not a host-wide network firewall or a database read-only role. Remote image restrictions and possible fallback/incomplete CMS content remain unchanged.

Next authorization: use this exact verified v3 handoff for ONE controlled read-only preview attempt at127.0.0.1:3000, after completing canonical-folder, environment, current public-key, fresh-profile, port and guard preflight. Permit only the seven previously reviewed informational pages/public CMS projections and intercepted or synthetic blocked-request checks. Verify actual listener/guard behavior before page acceptance, stop on any discrepancy without fallback, and terminate only the recorded owned process afterward. No rebuild is necessary if every seal still matches.

That scope excludes production mutations, private-data pages, SQL/migrations, Auth settings, booking/contact/admin mutation tests, Git publication, Netlify and Docker. This task grants no startup approval and has started no website.
