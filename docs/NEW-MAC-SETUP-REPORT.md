# New Mac setup report

Verified 2026-10-19 (Europe/Tirane).

## Location and GitHub

Canonical clone: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.
Original workspace: `/Users/aleksandermarleci/Desktop/Projects Dev/borealis-guesthouse-main`; this is a separate source snapshot without `.git`. Preserved untouched. Desktop search (depth 4) found no other Borealis directory before cloning; this is not an exhaustive disk search.

Cloned successfully from `https://github.com/marlecisander-bit/borealis-guesthouse.git` (fetch/push origin). Branch `main`; origin default branch `main`. HEAD `745b4aa56589cda5e5d0c8823ccc1cabb055e313` — Optimize public CMS loading and admin performance. HEAD versus origin/main: 0 ahead, 0 behind at clone time. Working tree initially clean. No pull, merge, commit, push, PR, or deployment performed. Report is an intentional untracked addition; environment example is ignored by `.env*`. Lockfile unchanged.

## Environment and dependencies

macOS; Git 2.54.0 (Apple Git-157), Node 24.21.0, npm 11.19.0. npm is selected by package-lock.json. Package requires Node >=20.9.0; installed Node meets that requirement. Netlify pins Node 20.19.5, so local/hosting runtime parity is not established.

`npm ci --no-audit --no-fund` passed: 378 packages. `npm ls --depth=0` passed. No dependency upgrades. Installed Next.js 16.3.4 (App Router/Turbopack), React/react-dom 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, ESLint 9.39.5, Playwright 1.63.0, Supabase JS 2.113.0, SSR 0.12.5, auth helpers 0.15.0, sharp 0.35.4. Read installed Next.js installation guide; no application code edited.

Warnings: npm marks ESLint and both legacy Supabase auth-helper packages deprecated. Review supported replacements in a separate authorized change; do not upgrade during setup. npm reported an unapproved `unrs-resolver` postinstall; no scripts were manually approved. Lint still passed. Security audit was not run.

## Environment readiness and Supabase

No `.env.local` exists in the clone. Created `.env.local.example` without overwriting any file, with safe placeholders/empty secrets only. Never use its placeholder project as an actual connection.

| Variables | Status / purpose |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Missing; required by proxy/browser/server clients |
| SUPABASE_SERVICE_ROLE_KEY | Missing; server-only privileged integration work |
| RESEND_API_KEY, RESEND_FROM_EMAIL | Missing; optional Resend booking email delivery |
| APP_URL / NEXT_PUBLIC_APP_URL | Unset; notification absolute links, localhost fallback |
| NEXT_PUBLIC_SITE_URL | Unset; site URL configuration |
| ICAL_SYNC_SECRET | Missing; scheduled calendar synchronization endpoint |
| STRIPE_SECRET_KEY / PAYMENT_PROVIDER_SECRET | Unset; code checks provider configuration; live payment integration not verified |
| NEXT_DIST_DIR, PLAYWRIGHT_BASE_URL | Optional build/test controls |
| PERF_ORIGIN, PERF_FETCH_LOG, CI | Optional diagnostics/test controls |

Intended Supabase organization and project identity are UNVERIFIED. No Supabase connection, authentication, database, storage, or production configuration was attempted. Confirm organization/project reference and approved development environment with owner before adding credentials. Do not infer identity from older documents or account history.

Auth code uses Supabase password sign-in and SSR cookies; live users, roles, redirect allowlists, and policies remain unverified. SQL is in `database/schema.sql`, CMS/storage/admin setup files, `database/migrations` (through 039), and `database/tests`. Duplicate migration numeric prefixes (006 and 037) exist; applied database history is unknown. No SQL or migrations ran. Storage code uses `public-media` for assets and signed uploads; bucket existence/policies unverified. Booking, Resend notifications, and iCal sync exist in source; end-to-end operation is unverified. Documentation suggesting migration application must not be followed during this setup.

## Validation

| Check | Result |
| --- | --- |
| Locked installation / dependency tree | PASS |
| npm run lint | PASS, exit 0 |
| npm test | PASS, 110 tests, 0 failures |
| npm run build | PASS, exit 0 |
| local tsc --noEmit | PASS, exit 0 after build-generated types |
| Development startup | PASS, Next ready on loopback port 3107 |
| GET / and GET /admin | FAIL, HTTP 500 |
| Playwright admin smoke | BLOCKED: auto-started server returns 500 during readiness; stopped |
| Full browser suite | Not run; Chromium cache absent and runtime env missing |

HTTP error: `Your project's URL and Key are required to create a Supabase client!`, thrown at `src/proxy.ts:7`. Cause: missing public Supabase configuration. Remedy: confirm intended project, provision approved development URL/public key, restart, and rerun smoke checks. Successful compilation does not establish runtime readiness.

Unit tests emit Node's module-type warning because package.json does not declare an explicit module type; tests pass. No source changes made to suppress warnings. Local verification processes were stopped. Detailed command logs are in `/tmp/borealis-{lint,test,build,types,dev,e2e}.log` and are temporary.

## Deployment and CI

`netlify.toml`: build `npm run build`, publish `.next`, NODE_VERSION `20.19.5`; immutable CDN caching for fingerprinted Next static assets. No `.github` workflows or checked-in scheduler found. Source indicates Netlify hosting intent; active hosted site, linked repository, production branch, deployment triggers, remote environment variables, and build history could not be established from repository files. Git default branch is main, but this does not confirm Netlify's production branch. No staging/preview environment assumed.

A push may trigger a production deployment if the remote Netlify site has repository auto-publishing enabled. Verify linked site and production branch in Netlify read-only before any future push. No deployment or remote infrastructure changes performed.

## VS Code / Codex readiness and next steps

VS Code application and `code` launcher exist. `code --status` emitted an Electron macOS process-inspection error, so active editor window and Git UI integration were not verified. Current task workspace still points to the original snapshot. Git CLI works in the new clone; no `.vscode` debug/launch settings exist. README, PROJECT_GUIDE, AGENTS.md and feature/database docs are present. Follow installed Next docs before future code changes. No extra extensions required for setup.

1. Open the canonical clone: `code /Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse` and start a Codex session there. Confirm VS Code Source Control recognizes main/origin.
2. Confirm intended Supabase organization/project reference and whether a safe development project exists. Obtain approved development credentials through a secure channel. Never paste service-role credentials into source or this report.
3. Copy `.env.local.example` to `.env.local` only if the latter does not exist. Replace placeholders with confirmed development values. Keep optional privileged/email/calendar integrations disabled until intentionally configured. Verify `.env.local` remains Git-ignored.
4. Run `npm run dev`; visit localhost:3000 and repeat GET / and /admin smoke checks. Verify sign-in, public reads and booking behavior only against the approved development environment.
5. Install browser prerequisite with `npm run test:e2e:install`, then run `npm run test:e2e` against local development. Do not point tests at production.
6. Repeat lint, tests, typecheck and build after environment setup. Inspect Netlify settings read-only before considering future pushes. Consider aligning local Node with the hosting runtime in a separate setup decision.

Status: repository and dependencies are ready locally; full functional development readiness is blocked by unconfirmed Supabase identity and missing credentials. No production resources were modified.
