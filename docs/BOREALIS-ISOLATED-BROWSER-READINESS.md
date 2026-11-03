# Borealis isolated browser readiness

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Isolated Chrome process lifecycle PASS; automation attachment BLOCKED. Overall local-preview readiness remains NOT READY. Borealis was not started.** The successful build, application source, production environment and sealed v3 launcher remain unchanged.

## Installed browser and supported isolation

Installed Google Chrome version155.0.8059.85, read from the application bundle's version metadata. Chromium documents launching an independent macOS instance with an explicit --user-data-dir: [official user-data directory documentation](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/user_data_dir.md).

Created a new owner-only task directory and user-data directory, with exclusive creation and an empty-directory check before launch:

`/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse/.local/isolated-browser-readiness-v1/user-data`

The directory was newly created, not linked or copied from another profile. It is separate from Chrome's documented ordinary macOS user-data location. No existing profile, cookie store, password store, bookmarks, extension directory or browser storage was read, copied, imported, cleared or modified by the task. Profile contents were not inspected after Chrome initialized them. The original empty-directory evidence establishes isolation by construction, not a later cookie-store audit.

## Lifecycle test and isolation evidence

Started the installed official Chrome binary directly with this exact user-data path, about:blank, --disable-sync, --disable-extensions, --disable-background-networking, --disable-component-update, --disable-default-apps, --no-first-run and --no-default-browser-check. The child received a minimal environment and no application credentials. No account sign-in, imports or extension installation was performed. Sync disabling was requested explicitly by command line; internal sync state was not inspected. No remote-debugging switch or endpoint was enabled.

The newly created child remained alive. Its own process command line confirmed the exact task-owned user-data path and no remote-debugging flag. Only that task-owned process was terminated; it exited after SIGTERM without requiring a forced kill. All Chrome main-process PIDs recorded before the test remained running afterward. No global quit, process-name kill or user-profile cleanup occurred.

Private sanitized lifecycle evidence: `.local/isolated-browser-readiness-v1/lifecycle.json`. It records launch argv/process ownership and results without credentials. The task-owned initialized profile is retained, closed, for an explicitly reviewed next step; it is no longer an empty directory after legitimate Chrome initialization. Any future requirement for a newly empty profile should use a new directory rather than pretending this initialized directory is empty.

## Browser-control readiness

The documented browser-control discovery lists one existing Chrome extension connection. Its supported capabilities provide tabs/navigation/screenshots/console/viewport operations, but no creation of or direct attachment to a new isolated profile/context. Troubleshooting documentation confirms the extension/native-host connection mechanism; no approved direct DevTools attachment mechanism was identified.

The new test profile intentionally had extensions disabled and none were imported or installed. Consequently it has no automation bridge. The existing authenticated Chrome connection was used only for capability/discovery documentation, never as a substitute test browser. No production-connected tab or localhost page was opened. No remote debugging, alternate automation driver or native-host repair was introduced.

| Verification | Result |
| --- | --- |
| New empty task-owned directory before launch | PASS |
| Separate process using exact isolated directory | PASS |
| No session/profile import | PASS by construction; no store inspection |
| Sync disabled | Requested via explicit flag; internal state not inspected |
| Remote debugging absent from owned argv | PASS |
| Isolated process closes; prior Chrome main processes remain running | PASS |
| Controller targets isolated instance | BLOCKED: no bridge in isolated instance |
| Browser access to loopback pages | NOT RUN: no safe attached controller |
| Fresh browser/session runtime acceptance | NOT RUN |

## Launcher and build preservation

Reran the v3 launcher check with a sterile environment and both preview flags1/1: PASS. It verifies exact source/file set, all500 build artifacts,22,428 dependency entries, Node20.19.5 binary hash, approved production URL, the privately fingerprinted build-associated public key and blank privileged integrations. No key value was logged. No Node, Next or application process was executed by that check.

Source: `.local/readonly-font-build-v2/source`.
Build: source/.next-readonly-preview-v1.
Launcher: `.local/readonly-launcher-handoff-v3/launcher.py`.
Handoff SHA256 remains `bd07397dc731caa1df78a70ca936df7a365f62b0593760b1863acfc462d0c10f`.
Source-manifest SHA256 remains `1ecfd5cfed83085e5617cdedb67674707637279b05104057ae3358801a26aac2`.
Node binary SHA256 remains `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

No build or launcher seal was changed. Both website attempt.json and process.json remain absent. Node20 identity is checked against the successful build receipt; its EOL caveat remains. No rebuild or dependency installation occurred.

Because full browser isolation/control readiness did not pass, the remaining phase3 live preflight was not performed: actual VS Code folder, fresh Auth-settings metadata validation, current port availability and browser/session behavior remain to be checked. Historical HTTP200 and earlier free-port findings are not asserted as current. Every command here used the canonical repository explicitly.

## Remaining blocker and next authorization

A fresh directory and independent Chrome process are technically available. The unresolved part is a supported controller connection to that isolated instance. One potential next path is a fresh installation of the supported browser extension into a dedicated test profile, with owner confirmation for that profile's extension access, no copied extensions and no account sign-in. That installation and its native-host compatibility were not attempted or guaranteed here. Keep extensions disabled until that specific setup is authorized. Do not repair native-host infrastructure or enable remote debugging speculatively.

Next authorize only connection setup for a dedicated isolated test instance using the supported extension mechanism, then verify the discovered connection targets it and that loopback navigation/owned closure work without production sessions. If that cannot be demonstrated, report unsupported attachment rather than using ordinary Chrome.

After browser-control readiness passes, separately authorize ONE controlled website startup through the unchanged sealed v3 launcher, complete all mandatory preflight checks including the approved public-key metadata GET, test only the seven approved pages/read projections and synthetic/intercepted blocks, then stop only its recorded owned process. No current approval is inferred to skip the browser gate.

No production data/settings changes, SQL/migrations, mutation tests, Git commit/push/merge/deployment, Netlify operation or Docker operation occurred. This report and private browser-preparation records are the only repository additions from this task.
