# Borealis v4 local preview acceptance

2026-10-20 (Europe/Tirane). Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall PASS for the restricted informational preview, with the known image limitation. Owner review complete; preview STOPPED and port3000 free. Normal unrestricted production-connected development is NOT approved or ready.** No production database/settings changes, SQL/migrations, Git publication, deployment, Netlify or Docker operation occurred.

## Owner visual feedback

“Looks OK — images missing due to preview restrictions.”

The owner confirmed review was finished and the website looked OK overall. Missing images are accepted as a limitation of this preview, not evidence of a production image problem. No screenshot or measured desktop/mobile breakpoint results were supplied; this records the owner's overall visual acceptance rather than inventing separate per-page/device measurements. Actual browser font appearance was covered only by that overall feedback, not an independent font-inspection test.

## Exact source/build/launcher identity

Launcher: `.local/readonly-compatibility-v4/launcher.py`.
Source: `.local/readonly-compatibility-v4/source`.
Build: source/.next-readonly-preview-v1.
Handoff SHA256: `20e21a42e13f0b6b0ffb3f4792f404de7014cc813071ca002d5e538e33faa957`.
Post-build source-manifest SHA256: `5c9bcafb4d0ad7e3126e096c06a2ec5b1513eedc8fa4f1916f2327a35182b40c`.
Node executable SHA256: `c37b0c15f83f1b63c4b162c6f47e586ed6b00ac9ed093037fe679f676f9d2195`.

Preflight verified317 source files,500 build artifacts,22,428 dependency entries, the sealed launcher/helper, Node20.19.5, paired preview flags, approved production URL/public-key fingerprint, blank privileged integrations and sterile runtime configuration. The approved metadata GET returnedHTTP200 without printing the key or retaining its body. A brand-new empty task-owned Chrome directory was used with sync/extensions disabled; no account sign-in/import was performed by the task and no normal browser profile was accessed.

The single authorized v4 startup attempt was consumed. Historical v2/v3 builds, receipts and attempt records were preserved; no automatic retry or rebuild occurred.

## HTTP and security checks

Recorded task-owned Next PID17778 passed stable ownership checks using kernel start seconds/microseconds, process group, executable, working directory and expected Next title. Process-scoped listener inspection showed only IPv4 TCP127.0.0.1:3000 for that process, with no wildcard/IPv6 listener.

Each approved public page returned200 with HTML, its page-specific title and header/main/footer markup, expected CSP, no-store and noindex headers, no Set-Cookie and no redirect. Requests used no real Auth session and disabled automatic redirects/proxy inheritance.

| Page | HTTP | HTML/security headers |
| --- | --- | --- |
| / |200 | PASS |
| /about |200 | PASS |
| /rooms |200 | PASS |
| /experiences |200 | PASS |
| /transfers |200 | PASS |
| /explore-koman |200 | PASS |
| /gallery |200 | PASS |

Both local font requests returned200; Manrope164700-byte and Cormorant1195560-byte responses matched the sealed files. Eleven synthetic policy/framework tests passed under OS network denial, covering original authority, cookie/Authorization stripping, forbidden methods/routes and mocked upstream rejection with zero forbidden delegate calls. A synthetic cookie/Authorization request only to approved /about returned200 without setting a cookie. No real booking/admin/contact/Auth/calendar/storage write endpoint was tested.

Cookie stripping/client refusal are established by sealed source/framework/mock checks; synthetic local response non-persistence is supporting runtime evidence, not a packet-level proof of upstream headers. No independent upstream traffic trace or automated browser console/network capture was collected. This report does not claim exhaustive observation of every native networking path.

## CMS and image limits

The reviewed runtime contract permits only the previously approved published public CMS projections. Pages rendered, and the owner accepted their overall appearance. CMS completeness versus fallback was not independently audited; readers may catch denied/error responses and show fallback content. HTTP200 and public text alone do not establish provenance of every displayed field.

External images and /_next/image remain blocked intentionally. No storage/RPC/image permission was added, and no allowlist or production setting was changed. A complete visual comparison including photographs requires a separately reviewed public-media read design or an isolated non-production data/media environment.

## Shutdown and preservation

Ran the unchanged v4 ownership-checked stop operation. It returned REJECT with CalledProcessError during process inspection; the exact point at which the process disappeared was not independently traced. A subsequent recorded-PID check confirmed17778 no longer existed. No further signal or broad process cleanup was applied. Binding127.0.0.1:3000 succeeded, and lsof found no TCP listener on port3000. Final state is verified stopped; the launcher's shutdown-result reporting was not a clean PASS and needs a small race-tolerant correction before future reliance.

Post-shutdown verification: all317 recorded source files and all500 recorded artifacts still match their hashes, and the handoff hash is unchanged. This task did not edit application source, build, launcher, environment or browser configuration. Normal Chrome sessions were not modified or terminated. The task-owned manual Chrome window was left unchanged; it may display the now-stopped local page.

Sanitized evidence: `.local/v4-preview-acceptance-v1/preflight.json`, http-security.json, manual-review.json and shutdown-and-final-result.json. The previous pending report is archived there as report-before-finalization.md. No key or raw HTTP response body is in this report.

## New Mac readiness decision

Ready for this restricted informational preview workflow: build/runtime, seven public routes, headers, local font delivery and owner overall visual review passed. It is not yet a complete normal development environment.

Remaining blockers/limits:

- Safe write-capable feature testing is unavailable while the local application targets production. Booking, admin, contact, Auth, calendar and storage mutations remain prohibited. Use an independently isolated test backend before broad functional development; no new project or runtime change is authorized by this report.
- Remote image rendering remains excluded. Review a narrow public-media design before another image-complete preview; do not simply disable the policy.
- Correct the shutdown inspection race so a process exiting during metadata lookup is reported as stopped only after verified PID absence and port release. Preserve PID-reuse protection and never signal a different process. No correction was made in this finalization task.
- Node20.19.5 matches the requested compatibility target but is EOL. A future supported-runtime alignment needs review/testing; Netlify/system settings were not changed.
- Full CMS completeness, detailed desktop/mobile measurements and an independent upstream traffic trace were not established. They must not be inferred from this bounded acceptance.

Future source publication/deployment requires its own reviewed diff, validation, production compatibility/recovery evidence and explicit approval. No database migration is justified merely by moving the application to the new Mac. No startup marker was reset; another preview needs a separately reviewed authorized attempt.
