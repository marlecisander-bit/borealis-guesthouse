# Borealis final local readiness

Verified 2026-10-19 (Europe/Tirane), following `docs/BOREALIS-PRODUCTION-SAFE-LOCAL-SETUP.md`. The only Supabase project is production: `rlqyruulxyanfgvnzkpe`.

## Outcome

The canonical Git clone and dependencies are available. Production-connected website startup remains prohibited. The environment public-key value needs correction/verification, and a fresh strictly offline build is blocked by externally fetched Google Fonts. No production requests or mutations were performed.

## Workspace and Git

All project operations used `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. The supplied IDE context shows `.env.local` in that clone. This confirms the active file's location, not the VS Code workspace root. `code --status` again returned a macOS Electron process-inspection error; native UI inspection was previously unavailable. Independently confirming the Explorer root remains a manual step. Use File → Open Folder and select the canonical clone; ensure Source Control shows `main`.

Branch: `main`. HEAD: `745b4aa56589cda5e5d0c8823ccc1cabb055e313`. Origin: `https://github.com/marlecisander-bit/borealis-guesthouse.git`. HEAD is 0 ahead/0 behind cached origin/main; no remote fetch occurred, so current remote freshness is unverified.

Before this report, only the two expected setup reports were untracked. Tracked-file diff was empty; no unexpected tracked changes or lockfile changes. This report is the third intentional untracked document. No commit, push, merge, deployment or remote changes performed.

## Environment checks — values withheld

Parsed `.env.local` locally using installed dotenv; file preserved unchanged.

| Check | Result |
| --- | --- |
| Production URL | Matches supplied production URL |
| Public-key value | Nonempty and not a recognized placeholder, but format UNRECOGNIZED |
| Legacy anon JWT validation | Value could not be decoded as a legacy anon JWT; no signature validation attempted |
| Modern publishable format | Value does not have the expected publishable prefix |
| SUPABASE_SERVICE_ROLE_KEY | Empty |
| RESEND_API_KEY / RESEND_FROM_EMAIL | Empty |
| STRIPE_SECRET_KEY / PAYMENT_PROVIDER_SECRET | Empty |
| ICAL_SYNC_SECRET | Empty |
| Git exclusion | `.gitignore:37` matches `.env*`; `.env.local` is not tracked |

Do not use the current key value until corrected locally. On `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, enter only the project's public publishable key or legacy anon key, without labels, pasted assignment text, or surrounding code fences. Do not insert a service-role or secret key. The installed clients support both public formats through this same variable. No key value or fragment is reproduced here. Matching a format does not establish validity or project association; those remain unverified without a separately approved request.

## Previous build failure

The temporary Node preload replaced `net.Socket.prototype.connect` and rejected a connection in Turbopack's `createIpc` worker path. Generated worker code explicitly connects to loopback `127.0.0.1`. The previous attempt to accommodate loopback still produced the same guard error; its exact normalization/cache behavior was not established. That JavaScript guard was the immediate failure point, not evidence of a CSS or application logic defect. It was not a sufficient demonstration of process-wide isolation for native tooling.

For this audit, an OS-level sandbox replaced that approach for the build. No source or dependency changes were needed. The original .next directory was not deleted; a fresh output directory was selected.

## Demonstrably isolated build attempt

macOS `sandbox-exec` is installed. Applying a nested sandbox inside the default execution environment failed with `sandbox_apply: Operation not permitted`. A separately launched restricted process successfully applied the OS profile. The profile denies network operations except localhost and Unix-domain sockets, and is inherited by build children. The old Node preload was not loaded.

Before invoking any build, the same restricted process verified:

- A local TCP listener/client exchange succeeded on loopback.
- External IPv4 connection to a documentation-only test address was denied by the OS with EPERM/EACCES.
- External IPv6 connection to a documentation-only test address was likewise denied.

These were raw socket policy probes, not HTTP requests. No Supabase address was probed. Build ran only after all preflight checks passed.

The child environment was rebuilt from basic local process variables; public Supabase URL/key and every listed integration secret were explicitly empty, overriding .env.local. Telemetry was disabled. Build output used `.next-offline-final-readiness`, a previously unused output location, so existing .next cache was not relied upon. The OS policy remained in force for the entire build; external access was never enabled.

Command executed under those controls: `npm run build`.

Result: FAIL, exit 1. Turbopack reached font compilation; `next/font/google` failed to fetch Manrope and Cormorant Garamond from Google Fonts. `src/app/layout.tsx` imports those fonts. The local-worker guard error was absent from this fresh attempt. Outbound-deny protection prevented external font downloads as intended. No proxy or network exception was added to make it pass. This failed artifact must not be used with `next start`.

Temporary profile, runner and log: `/tmp/borealis-final-offline.sb`, `/tmp/borealis-final-offline.py`, `/tmp/borealis-final-build.log`. They contain no credentials and are temporary session artifacts, not a permanent development setup. Existing lint/unit/typecheck results are in the preceding safety report; they were not unnecessarily rerun here.

## Requirements for safely opening the public website locally

There are two distinct modes; neither was started during this task.

### Fully offline viewing

1. Supply approved local mock content or an isolated local Supabase instance. Keep the production URL/key out of the server environment and generated browser bundle. Merely blanking the URL/key currently causes the page proxy to fail; a usable offline mode needs separately authorized implementation/configuration work.
2. Make font assets available offline. Recommended: obtain properly licensed font files through an approved separate download step and, with separate source-change authorization, use next/font/local. The strictly offline build must then pass with outbound access still blocked. Do not weaken isolation or configure an external proxy to fix this build.
3. Enforce outbound restrictions for BOTH the Next.js process and browser. A server-only sandbox cannot stop browser JavaScript from calling production if production values are bundled. Permit loopback/Unix communication only.
4. Start on loopback only after that setup is validated, using an isolated browser profile without Supabase sessions. Do not enable integrations. No startup command for the current production .env.local is authorized here.

### Production-backed, read-only inspection

1. Correct the local public-key format and obtain separate explicit approval for the precise read-only request scope. This task grants no approval for production connectivity.
2. Follow the previous report's cookie-free, JavaScript-free HTTP GET candidate list: public informational pages only, without query/preview/auth state. Avoid `/admin/**`, `/api/**`, `/book/**`, `/booking/confirmation/**`, forms, authentication and synchronization.
3. Use a fresh request context with no auth cookies and no browser JavaScript/prefetch. Public keys can invoke write-capable booking/contact RPCs; empty privileged secrets do not establish read-only access. Live production policies/functions remain unverified.
4. Ordinary interactive browsing requires a separate review and enforceable write prevention covering browser and server requests; user discipline alone is not a technical read-only boundary. The current code does not provide that guarantee. The safe alternative for full development and interactions is a separate development database/local Supabase or mocks.

## Remaining blockers and next steps

- Public key is non-placeholder but has unrecognized format; correct it locally without posting it in chat.
- Strict offline build needs local font assets or another separately authorized offline-font solution; no source changes were authorized or made.
- No usable isolated data environment/offline mode exists yet; the only database is production.
- VS Code's actual open-folder root could not be independently verified; confirm manually.
- Live Supabase connectivity, live database definitions/policies, current GitHub freshness and Netlify settings remain unverified; no remote checks were attempted.

Do not run plain npm run dev/start with the current production .env.local as a readiness shortcut. Prepare an isolated local environment first, or separately approve the narrow read-only inspection scope. No website, browser automation, booking/auth/email/storage/calendar workflow, SQL or migration was run.
