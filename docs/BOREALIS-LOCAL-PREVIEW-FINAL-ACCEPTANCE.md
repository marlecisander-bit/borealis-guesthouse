# Borealis final controlled local preview acceptance

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL at mandatory browser-isolation preflight. Website NOT STARTED; runtime, functional and visual acceptance NOT RUN.** The verified v3 handoff passes its integrity check. Startup stopped because a fresh isolated browser profile could not be established through the available browser control surface. This follows the explicit instruction to stop on any failed preflight. No startup token was submitted and the one-attempt marker remains unused.

## Verified identity and preflight results

Source: `.local/readonly-font-build-v2/source`.
Build: that snapshot's `.next-readonly-preview-v1`.
Launcher: `.local/readonly-launcher-handoff-v3/launcher.py`.
Handoff configuration SHA256: `bd07397dc731caa1df78a70ca936df7a365f62b0593760b1863acfc462d0c10f`.
Post-build source-manifest SHA256: `1ecfd5cfed83085e5617cdedb67674707637279b05104057ae3358801a26aac2`.
Node binary SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

Ran the sealed launcher check with a sterile caller environment and both preview flags1/1. Result PASS: exact launcher and sealed manifests, complete source file set/content, all500 build artifact hashes/file set,22,428 dependency entries and the recorded Node20.19.5 binary remain unchanged. No rebuild, source edit, resealing or historical-receipt change occurred.

The launcher also verified the exact approved production URL, the private public-key fingerprint bound to this build, blank privileged integration values, absence of inherited deployment/cloud/proxy credentials in its sterile input and empty reserved runtime HOME/TMPDIR. It never printed the key. Node20.19.5 identity was checked by binary hash against the successful build evidence; Node was not executed in this preflight.

An actual temporary bind check confirmed127.0.0.1:3000 was available, then immediately closed the probe. The initial sandbox denied the bind permission; the approved elevated check succeeded. No application listener was started or retained. The fixed launcher argv remains Next start with explicit --hostname127.0.0.1 --port3000; actual application binding is untested.

All filesystem commands explicitly used the canonical repository. Actual VS Code open-folder root was not independently confirmed. Fresh HTTP Auth-settings validation and the remaining preflight checks were not completed after the browser-isolation blocker; prior public-key HTTP200 evidence remains historical only.

## Exact browser blocker

The available selected browser is the existing extension-connected Chrome instance previously used for authenticated Dashboard work. Its documented capabilities provide tabs, navigation, screenshots, console inspection and viewport overrides. No fresh-profile or isolated-context creation/verification capability is advertised. A new tab or viewport override would not establish a clean browser profile.

The Chrome control skill prohibits inspecting browser cookies, local storage, profiles or session stores. None were inspected or cleared. No alternate browser automation mechanism or ordinary-profile navigation was used to bypass the required isolation. The empty reserved browser-profile directory alone is not proof of an active isolated browser.

No current browser page was opened against production or localhost. No production session was forwarded, because there was no preview request; this is not evidence that runtime session stripping has passed acceptance.

## Acceptance results

| Area | Result |
| --- | --- |
| `/` | NOT RUN |
| `/about` | NOT RUN |
| `/rooms` | NOT RUN |
| `/experiences` | NOT RUN |
| `/transfers` | NOT RUN |
| `/explore-koman` | NOT RUN |
| Actual rendering, header/navigation/footer | NOT RUN |
| Desktop/mobile/responsive visual checks | NOT RUN |
| Browser font loading and missing-image review | NOT RUN |
| Published CMS content reads/completeness | NOT RUN |
| Runtime CSP/noindex/no-store and session stripping | NOT RUN |
| Runtime external requests/privileged clients/RPC rejection | NOT RUN |
| Browser console | NOT RUN |
| Intercepted or mocked blocked-route verification this task | NOT RUN; prior offline policy/handoff tests remain historical |

No real booking, contact, admin, Auth, calendar or storage mutation endpoint was exercised. No security-policy relaxation or allowlist expansion occurred. There is no runtime PASS claim based on the successful build or static guard presence.

## Shutdown and preservation

No preview process was created, so no shutdown was needed. The v3 attempt.json and process.json do not exist. Build artifacts, source, environment and prior reports remain preserved; only this report was added. No production data/configuration, SQL/migration, Git publication, Netlify or Docker operation occurred.

## New Mac readiness and next action

Build and launcher preparation are verified; runtime and visual readiness remain unproven. Before another startup task, make a fresh isolated Chrome profile available to the browser connection, with no production login/session and the supported browser extension, then explicitly confirm that profile was freshly created. Do not sign into Supabase or Netlify in that test profile. Existing user browser profiles need no clearing or modification.

Once that prerequisite is available, complete every preflight, including canonical-folder confirmation and the approved public-key metadata GET, then use the unchanged v3 launcher for the authorized single controlled attempt and ownership-checked shutdown. No additional source/build change is presently established as necessary. Do not bypass the isolation gate or use the older launcher.

Future deployment remains outside this task: reviewed source diff, passing runtime/visual acceptance, current runtime/build compatibility and explicit Git publication/deployment approval are still required. Main auto-publishing must be considered before any push. No database migration is justified by this local preflight blocker.
