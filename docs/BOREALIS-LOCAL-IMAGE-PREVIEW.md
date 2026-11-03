# Borealis local image-enabled preview

2026-10-20 (Europe/Tirane). **Image-enabled local informational preview RUNNING at http://127.0.0.1:3000. Technical checks PASS; owner visual confirmation pending.** This fulfills the owner's selection to show public images locally while keeping production unchanged. No Git publication, Netlify deployment, production settings/data change, SQL/migration or Docker operation occurred.

## Exact image-only change

Inventoried the actual img/source URLs emitted by the seven previously approved pages. Found nine exact HTTPS public image object URLs in the existing production public-media bucket. Verified each with anonymous GET, no cookies/API key/Authorization, redirects disabled and bounded image bytes; all returned200 with JPEG/WebP content and valid raster signatures. Kept metadata/checksums only, not downloaded image files. No bucket listing, private objects, signed URL or new CMS projection was accessed.

Added src/lib/readonly-preview/public-images.ts with those nine fixed URLs. Preview CSP img-src now lists only those exact object paths alongside self/data. It does not allow the bucket prefix generally, other projects, signed objects, arbitrary hosts or Unsplash. CSP source-path matching does not constrain query strings, but these destinations are fixed public image objects; no request body, authentication or write endpoint is involved. connect-src remains self and form-action remains none.

next.config.ts sets images.unoptimized only when both existing preview flags equal1. Next Image/getImageProps then emits direct public image URLs rather than the blocked general /_next/image endpoint. Normal production flags absent retains the previous optimized behavior. The optimizer route remains denied; server global fetch still rejects storage/Auth/RPC requests. Booking/admin/contact/auth/calendar/storage writes remain blocked. No visual CSS/layout or application functionality was redesigned.

Updated the existing CSP assertion and added two image regressions.125 application tests, ESLint and TypeScript passed under Node20/network denial. The full production-style build passed in52.2seconds under OS deny network*, with local fonts and paired flags. Nine cache-integrity and13 mocked ownership/shutdown tests passed against the final runtime copy.

The first staging integrity check rejected compiler-created empty SWC directories not represented in the immutable artifact graph. No running server was changed at that point and the validator was not relaxed. As with v6, prepared a separate runtime copy from only the exact verified source/artifact manifests; preserved the complete staging build and empty compiler caches unchanged. Final exact integrity checks passed.

## Versioned build and runtime

Build/staging source: `.local/readonly-images-v7/source`.
Runtime source: `.local/readonly-images-v7/runtime-source`.
Runtime output: runtime-source/.next-readonly-preview-v1.
Launcher: `.local/readonly-images-v7/launcher.py`.
Handoff SHA256: 17e9e10f2a5242709590da7d2738e71fa20507760dbcad614b69dcbc6e270796.
Task-owned PID: 18704.

All318 post-build source files,500 compiled artifacts and22,428 unchanged dependency entries are manifest-bound. Immutable runtime files/directories are read-only; only the validated private FETCH data cache is writable. Cache, ownership, session and request safeguards were retained. Historical builds, launchers and consumed markers were not reset.

Before switching, the old v6 shutdown command returned an inspection error while its PID still existed transiently. Subsequent read-only checks confirmed the old PID was absent and port3000 had no listener and was bindable. No additional signal was applied. Only then was the first v7 startup executed, through its new unused marker. There was no v7 retry or unrestricted fallback. The existing shutdown reporting race is therefore not claimed fully resolved in every exit timing, although safe final-state checks prevented unrelated termination.

## Runtime checks

Node20.19.5, approved production URL/public-key fingerprint and metadata HTTP200, paired flags, blank privileged integrations and sterile environment passed preflight. Created another new empty task-owned Chrome profile, with sync/extensions disabled, no imports/sign-ins and no remote debugging. No normal browser session was reused.

All seven routes returnedHTTP200 with HTML and restrictive CSP/no-store/noindex headers, no redirects and no Set-Cookie: /, /about, /rooms, /experiences, /transfers, /explore-koman and /gallery. Actual HTML image/source tags use only the exact approved direct URLs and no image-optimizer URLs. Each image destination is present in CSP. Both local font responses match sealed bytes. Post-request cache/immutable validation passed. Stable process ownership and process-scoped listener inspection confirm only127.0.0.1:3000 for the task-owned server.

No live mutation route/function was tested. Public image GETs are additional authorized read traffic; no independent packet-level trace was collected. Sealed application transport/CSP and offline tests establish the reviewed boundary, not a blanket host-wide firewall or database read-only role. CMS completeness versus fallback and actual desktop/mobile photo appearance await owner feedback. New image URLs introduced by future CMS changes will remain blocked until individually reviewed.

The homepage was opened in the exact new Chrome instance for manual review. Keep the server running until the owner explicitly requests stop. When stopping, use this version's recorded owned PID checks, preserve evidence and verify port release; do not kill by port/process name or affect normal Chrome.

Private sanitized evidence: public-image-validation.json, build.sanitized.log, manifests/receipt/handoff, preflight.json, running-status.json and validation.json under .local/readonly-images-v7. No key or cached application data is printed in this report. Production remains unchanged; this is still a restricted public-page preview, not unrestricted booking/admin development.
