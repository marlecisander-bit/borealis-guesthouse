# Borealis — development test readiness

21 October2026, Europe/Tirane. **GO for local source development and the documented offline checks. Live database/Auth/Storage mutation tests and deployment remain separate approvals.** Existing infrastructure only; no application server, new environment or production writer was started.

## Repeatable command

From the canonical repository, run:

```sh
python3 scripts/borealis-safe-checks.py
```

The new runner requires the existing reviewed Node20.19.5 and native Mac `sandbox-exec`. It refuses to run if either prerequisite is unavailable; it does not install tooling, start Docker or fall back to unrestricted networking. It creates a fresh compilation/test snapshot under ignored `.local/safe-checks-<UTC timestamp>/`, copies only source/public/tests/configuration plus proposed SQL used by static tests, and makes an independent APFS dependency clone. It copies no dotenv, browser profile, database backup, Git directory or deployment configuration. This is a private source snapshot, not a second application deployment or database.

The child environment is allowlisted: public Supabase build configuration, local temporary/home directories and build settings only. No inherited provider/service/deployment credentials or preview flags are supplied. All checks run with OS `deny network*`. Unit tests use the reviewed TypeScript loader, followed by TypeScript noEmit, ESLint and a normal-mode Webpack Next build. A failed check stops subsequent checks; no automatic retry, server startup, migration or deployment follows. Dependency and canonical source hashes are checked again after success. Logs and artifact manifests stay in `.local/`.

The runner reads only the public-key value from existing `.env.local`; it does not copy the file. It requires the approved public-key form, redacts that value from logs, and supplies no privileged client fallback. The normal-mode build compiles writer paths but cannot dispatch them through the network. Public-content fallback/prerender output is not live-content certification.

## Fresh results

Run evidence: `.local/safe-checks-20261021T090428956662Z/`.

| Check | Result |
| --- | --- |
| Unit/static/mock/framework regressions |134/134 PASS; zero failed/skipped |
| F01 behavioral regressions |Nine included cases PASS |
| TypeScript noEmit, incremental off |PASS |
| ESLint source/tests/Next configuration |PASS |
| Next16.3.4 normal production-style build |PASS; Webpack;500 artifacts |
| Dependency clone |22,428 file/link entries identical |
| Dependency integrity after run |PASS for canonical and clone |
| Canonical application source after run |Unchanged |
| Separate deployed public GET checks |Seven informational pages HTTP200 HTML, no redirects or Set-Cookie |
| Fresh F02 catalog permission check |anon/authenticated denied both helpers; postgres/service_role retained |

The GET checks used only `/`, `/about`, `/rooms`, `/experiences`, `/transfers`, `/explore-koman` and `/gallery` on the existing Netlify origin, no cookies/form submissions and bounded responses; bodies were not saved. They did not run browser mutation/E2E tests, certify production security headers or prove that CMS content is complete. A separate ten-second READ ONLY metadata transaction checked F02; no booking helper was invoked. Dashboard query drafts/logging are platform side effects, not application-data writes.

## Test boundaries

Safe today: the runner above; synthetic TypeScript permission/booking/pricing/capacity fixtures using mocks/pure functions; source-level route and public-reader regressions; dependency/source/artifact integrity checks; bounded approved public GETs; local encrypted-backup verification. Mock permission/booking cases do not establish real PostgreSQL RLS, transaction/concurrency, expiration or notification behavior.

Do not use ordinary `npm test` as a substitute for the reviewed Node20 TypeScript-loader invocation. Do not run `npm run dev`, default Playwright E2E, historical SQL tests or the55-case live security matrix automatically. Playwright's current default starts a normal dev server; its tests must be classified before use. Passing a live URL alone does not make an E2E test read-only.

Separate explicit approval is required for: F01 DDL/GRANT/REVOKE/RPC installation; synthetic properties/CMS rows and real-role SQL calls; temporary Auth users/sessions/membership changes; direct REST authenticated save/publish/denial probes; actual booking holds/confirmation/expiry/concurrency; Storage uploads/deletes/signing-token tests; mail/calendar/payment provider actions; source push/deployment. Even rollback-only fixtures require review for triggers/external effects. No such test ran here.

No new environment is a prerequisite added by this report. Existing-project synthetic tests must have an approved fixture ID namespace, bounded cleanup, integration isolation and transaction/role plan. No existing account is to be disabled or existing content used as a negative-test fixture.

## F01 revalidation

All eight prepared compatibility-patch file hashes still match the prior manifest. The134-test run covers the ten-key contract; trusted property/key arguments to private read/save RPCs; O/M/E checks; draft/published merge integration using mocks; denied/cross-property/malformed inputs; no-store private transport; successful-publication-only public cache invalidation; preview failure behavior and public-reader compatibility. No privileged fallback was added.

Real RPC installation, PostgreSQL authorization/save/merge behavior, PostgREST column denial, authenticated preview and live public-cache invalidation remain NOT TESTED. F01 is prepared for controlled execution review, not accepted as remediated. See the [execution checklist](BOREALIS-F01-PRODUCTION-EXECUTION-CHECKLIST.md).

Normal frontend/source development can proceed now. Runtime support/dependency advisories, full platform behavior and release readiness retain their prior audit limits; byte-identical dependencies are not a current vulnerability assessment. Test reports do not authorize a production write or deployment.
