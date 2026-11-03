# Borealis manual local preview acceptance

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL at mandatory session-isolation preflight. Website NOT STARTED. HTTP, runtime and manual visual acceptance NOT RUN.** The owner answered “I signed in or imported sessions” when asked to confirm that the task-owned isolated Chrome profile had no imported sessions and no Google, Supabase, GitHub or Netlify sign-ins. The answer does not identify which account or import occurred; none is inferred. It fails the required session-free profile condition, so startup stopped immediately.

## Launcher and build identity

The unchanged v3 launcher check passed under a sterile caller environment with both read-only preview flags1/1. It verified sealed launcher/manifests, complete source identity, all500 build artifact hashes/file set, required22,428 dependency entries and the recorded Node20.19.5 executable hash. It also checked exact approved production URL, the build-associated public-key fingerprint, blank privileged integrations, and sterile configuration. No key value was displayed.

Source: `.local/readonly-font-build-v2/source`.
Build: source/.next-readonly-preview-v1.
Launcher: `.local/readonly-launcher-handoff-v3/launcher.py`.
Handoff SHA256: `bd07397dc731caa1df78a70ca936df7a365f62b0593760b1863acfc462d0c10f`.
Post-build source-manifest SHA256: `1ecfd5cfed83085e5617cdedb67674707637279b05104057ae3358801a26aac2`.
Node binary SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

All commands used the canonical repository explicitly. No application source, launcher, seal, dependency, build output or production dotenv was changed. The launcher check did not run Node or Next. The source instrumentation and read policy were read for the planned runtime verification; they were not edited.

## Preflight stop and security limits

The existing profile's fresh-directory/process provenance remains historical evidence, but it no longer establishes a session-free profile after the owner's reported sign-in/import. Manual operation removes the automation requirement, not the session-isolation requirement.

No browser session, cookies, storage or profile account information was inspected or cleared. No normal Chrome session was accessed or modified. No attempt was made to compensate with route guards alone, reuse the contaminated profile, or retry in unrestricted mode.

The current public-key Auth-settings metadata GET, port availability, actual listener ownership and remaining runtime preflight checks were not performed after the failed confirmation. Earlier successful key/port findings remain historical. The public-key fingerprint passing the local check is not a fresh HTTP validity check.

## HTTP/security and page results

| Area | Result |
| --- | --- |
| Seven approved routes: /, /about, /rooms, /experiences, /transfers, /explore-koman, /gallery | NOT RUN |
| CSP/no-store/noindex, redirects and loopback-only runtime listener | NOT RUN |
| Runtime cookie stripping, privileged-client denial and upstream request behavior | NOT RUN |
| Synthetic/intercepted blocked-route tests in this task | NOT RUN |
| Published CMS reads and content completeness | NOT RUN |
| Local browser font loading | NOT RUN |

No request was dispatched to a production mutation endpoint. No booking, contact, admin, Auth or calendar mutation test, SQL or migration occurred. No live browser or local page acceptance request was made.

## Manual findings and desktop/mobile results

No manual observations were requested after the failed preflight, because there is no running preview to inspect. Homepage, header/navigation/footer, typography, published content, desktop1440/mobile390 layouts, console errors and missing-image/regression findings remain NOT RUN. Visual acceptance is not marked PASS.

Known design limitation remains unchanged: remote images and the Next image optimizer are blocked by the reviewed preview policy. A future preview may show missing images/placeholders; this must be recorded rather than fixed by automatically expanding the allowlist. Prior build-time local-font verification does not prove browser rendering.

## Shutdown and preserved state

No website process was created, so there was nothing to stop. The v3 attempt.json and process.json remain absent; the controlled startup attempt is unused. No port-free claim is made from this stopped task because no current bind check was run. Existing browser processes were left unchanged.

## Remaining blocker and New Mac readiness

Build/launcher preparation remains verified; runtime and visual readiness remain unproven. The immediate prerequisite is a different newly created, task-owned Chrome user-data directory with no account sign-in, imports or production sessions. Manual visual acceptance needs no automation extension, so no extension installation or browser-account login is necessary for that path. Preserve the existing profile rather than inspecting or clearing its sessions implicitly.

After the new profile is prepared and the owner confirms no sign-ins/imports, complete all mandatory preflight checks, then use the unchanged v3 launcher for one authorized startup. Agent performs the approved HTTP/security and mocked/intercepted blocked-request checks; owner manually inspects only the seven informational pages at desktop/mobile sizes. Wait for owner observations before ownership-checked shutdown and the final visual decision.

No production database/settings changes, Git commit/push/merge/deployment, Netlify change or Docker operation occurred. No database migration or deployment is justified by this browser preflight failure.
