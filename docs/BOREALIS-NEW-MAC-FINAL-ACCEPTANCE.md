# Borealis new Mac final acceptance

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: one controlled startup reached a verified loopback listener, but the homepage returned403. Preview stopped immediately; port3000 is free. New Mac runtime/visual acceptance is not complete.** No automatic retry, policy relaxation, rebuild or production change occurred.

## Configuration and build identity

Unchanged launcher: `.local/readonly-launcher-handoff-v3/launcher.py`.
Source: `.local/readonly-font-build-v2/source`.
Build: source/.next-readonly-preview-v1.
Handoff SHA256: `bd07397dc731caa1df78a70ca936df7a365f62b0593760b1863acfc462d0c10f`.
Post-build source-manifest SHA256: `1ecfd5cfed83085e5617cdedb67674707637279b05104057ae3358801a26aac2`.
Node executable SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

Sealed launcher preflight PASS: full source,500 build artifacts and22,428 dependency entries, exact production URL/public-key fingerprint, blank privileged integrations, sterile HOME/TMPDIR and caller environment. Node executable reportedv20.19.5. The approved GET /auth/v1/settings returnedHTTP200; key and response body were not displayed or retained. Both preview flags were1. No production Auth operation was invoked.

PASS: nine existing offline tests under Node20 and OS network denial, covering fonts/provenance, read-only policy/environment rejection, cookie/auth stripping and mocked forbidden requests making zero delegate calls. Initial nested sandbox invocation lacked sandbox permission; the authorized elevated network-denied invocation ran successfully. No tests invoked production mutation endpoints.

## Fresh manual browser

The owner said the previous newest profile had sign-ins/imports or uncertain status. As explicitly authorized, it was left untouched and a different fresh owner-only directory was created and verified empty before launching Chrome:

`.local/new-mac-final-preview-v1/chrome-user-data`

Official Chrome was launched only at about:blank, with sync/extensions/background networking/default apps disabled, first-run flow suppressed and no remote debugging. Its exact new user-data path and live process identity were verified through its own process metadata. No profile files or sessions were copied or inspected. No account login/import was performed by the task. No additional extension or automation troubleshooting occurred. The fresh blank window was left open; no Borealis page was opened in it because the HTTP gate failed first.

## One startup and immediate stop

Used only the unchanged sealed v3 launcher with its fixed startup confirmation and fresh-browser-review assertion. The single attempt was consumed; task-owned server PID17404 was recorded. It listened on IPv4 TCP127.0.0.1:3000; process-scoped lsof showed no wildcard/IPv6 listener for that process.

The first homepage GET without cookies/auth, with proxy environment disabled and redirects prohibited, returnedHTTP403. The runtime identity check also differed from the launch-time record. These failures prevented further page requests or owner visual testing. No second startup or normal-mode fallback occurred.

Next.js deliberately changes process.title to next-server (v16.3.4). That explains why its current process command string differs from the recorded initial Node argv. The existing launcher stop operation requires that entire string to remain identical, so it could not safely be relied on for this renamed process. Cleanup instead verified the recorded PID's exact original start time, process-group ownership, expected Next process title and exact verified source working directory, then sent SIGTERM only to that PID. Port3000 was confirmed bindable afterward. Historical process/attempt records were preserved rather than rewritten.

## Offline reproduction of local compatibility failures

Without starting a server or allowing networking, constructed the installed NextRequest for http://127.0.0.1:3000/. Its request.url becomes http://localhost:3000/. The unchanged allowedPreviewRoute rejects that normalized URL but accepts the original numeric-loopback URL. The proxy passes request.url into this strict comparison. This reproduces a sufficient local cause of the homepage rejection; no production schema or credential change is implicated.

Installed Next16.3.4 start-server implementation also explicitly assigns the next-server process title, confirming the identity mismatch cause. These two framework behaviors were missed by the previous synthetic-only preparation checks. They require narrowly reviewed compatibility corrections, not adding arbitrary hosts/routes or weakening mutation restrictions.

## Acceptance results

| Area | Result |
| --- | --- |
| Homepage HTTP | FAIL403 |
| About, Rooms, Experiences, Transfers, Explore Koman, Gallery | NOT RUN after failed gate |
| Actual loopback-only listener | PASS before shutdown |
| Runtime security headers and cookie/session behavior | NOT ACCEPTED; request failed before full inspection |
| Production upstream-request trace / content completeness | NOT RUN; no independent traffic trace collected |
| Forbidden operations | Offline mocked policy checks PASS; no live mutation endpoints tested |
| Browser font loading | NOT RUN; local-font offline checks PASS |
| Manual appearance / header / navigation / footer | NOT RUN |
| Desktop/mobile visual acceptance | NOT RUN; owner was not asked to inspect a failing preview |
| Owned shutdown and port release | PASS |

No production write endpoint was invoked by this task. The denied request and offline checks are not a comprehensive runtime network trace or proof of every framework path. No production booking/private-data retrieval or authenticated browser test was performed. Missing images remain a known intentional restriction: remote images and the optimizer are blocked, and no image allowlist was expanded.

## Preservation and evidence

Private sanitized evidence: `.local/new-mac-final-preview-v1/preflight.json` and runtime-result.json. They contain status/process metadata, no credentials or response bodies. All500 recorded artifact hashes were checked again after shutdown: PASS, zero mismatches. Application source, font assets, launcher and seals were not changed. No Git publication, deployment, Netlify change, production Auth setting, SQL/migration or Docker operation occurred.

## New Mac readiness and next work

Not yet ready for a working preview: the installed runtime and build work, but the current strict request-origin comparison blocks all approved pages after Next normalization, and the launcher identity record does not account for Next's process rename.

Required next scope is preparation and offline validation of two minimal compatibility corrections: validate the real loopback request authority safely despite framework URL normalization, while preserving exact port/path/method restrictions; and make owned cleanup resilient to the documented process-title change using stable process identity. Review the installed Next documentation and add framework-level regression cases. Preserve existing builds/receipts, prepare a new versioned build/handoff if source changes are needed, and review before another explicitly authorized startup. The consumed v3 attempt must not be silently reset or retried.

No production database migration or deployment is needed for these local issues. Manual acceptance remains pending until a corrected, reviewed preview passes its HTTP/security gates and the owner confirms the seven pages look correct.
