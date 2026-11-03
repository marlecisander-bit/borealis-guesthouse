# Borealis development baseline — 21 October 2026

**DEVELOPMENT READY for scoped local work. F01 preparation COMPLETE; F01 production implementation PENDING.** This closes preparation rather than restarting an audit or infrastructure plan. Local readiness does not certify production security or daily operations. F01/F03 remain unresolved in the deployed platform.

## Canonical workspace and existing infrastructure

Use `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse` explicitly for every command. The session initially started in the older `/Users/aleksandermarleci/Desktop/Projects Dev/borealis-guesthouse-main` clone. VS Code's local workspace record showed that clone; the canonical folder was opened in a separate VS Code window and its workspace registration verified. Existing windows and unsaved work were preserved. No clone, branch, database or hosting resource was created. Do not edit a private build/preview snapshot as canonical source.

| Identity | Evidence / status |
| --- | --- |
| Local branch / HEAD | `main` / `745b4aa56589cda5e5d0c8823ccc1cabb055e313` |
| GitHub | `marlecisander-bit/borealis-guesthouse`; fresh read-only `git ls-remote` gives the same remote main SHA |
| Netlify | `borealisguesthouse.netlify.app`; last recorded deployed SHA is the same main, deploy `6aa69097a30b800008847240`; auto-publish from main ON. Historical dashboard evidence, not refreshed in this task |
| Supabase | Existing `rlqyruulxyanfgvnzkpe`, organization `kywcwpvblqjgfhetefxx`, Free, eu-west-1, PostgreSQL 17.6; historical verified identity, no database connection opened today for this task |
| Other historical resources | Preserved; no deletion or reuse of the earlier DEV project |

A push to main would cause deployment. No staging, commit, push, merge, Netlify setting change, SQL execution, live account/content/booking/Storage operation or Docker action occurred.

## Working tree and publication hygiene

Before documentation changes: **16 tracked modifications, 134 untracked files, zero staged files**. This is a preserved working tree, not a clean release branch. All pre-task file bytes are privately inventoried and checked after this task. Only the two requested reports are added as source-tree deliverables.

Tracked modifications:

- `.gitignore`
- `eslint.config.mjs`
- `next.config.ts`
- `src/app/admin/content/site-actions.ts`
- `src/app/layout.tsx`
- `src/lib/repositories/admin/languages.ts`
- `src/lib/repositories/admin/site-content.ts`
- `src/lib/repositories/public/homepage.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/fetch.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/service.ts`
- `src/proxy.ts`
- `src/services/site-content.ts`
- `src/types/site-content-cms.ts`
- `tests/performance.test.ts`

Untracked work includes prior audit/recovery/preview reports and SQL proposals, local fonts/provenance/licenses, the CMS RPC adapter, offline tests, preview instrumentation/modules and `scripts/borealis-safe-checks.py`. The exact 134-file inventory and hashes are private under `.local/development-baseline-20261021/`; no historical file was cleaned up. F01's reviewed source-only candidate is independently inventoried rather than equated with this whole dirty tree.

`/.local/`, `.env` and `.env.local` ignore checks PASS. No `.local/`, environment file, node_modules or encrypted dump is tracked by the bounded filename check; staging is empty. Backup/browser/credential evidence is not staged. This is scoped publication hygiene, not an all-history secret scan. Never force-add ignored material or use a broad unreviewed publication set.

The existing Manrope/Cormorant Garamond local TTFs, both OFL notices, metadata and pinned provenance remain accounted for in the verified candidate. Asset hashes match prior provenance. No fonts were downloaded or dependencies added.

## Runtime, tests and builds

Use the pinned **Node 20.19.5 / npm 10.8.2** and existing `package-lock.json`; Next **16.3.4**, React **19.2.8**. `npm ls --all --json` under OS network denial exits 0 with no dependency problems. All **22,428 dependency file/link entries** match the validated manifest; the lockfile matches the v3 candidate.

Node 20 is the reproducibility target for this baseline, not a supported-lifecycle claim at this date. Runtime modernization remains F23 work. The ordinary `node --test *.ts` package script is not the documented Node 20 TypeScript test setup; use the existing reviewed loader/workflow.

Fresh canonical checks use `python3 scripts/borealis-safe-checks.py`: private source/dependency clone, sterile environment, OS `deny network*`, no privileged/provider credentials or preview flags, no server startup. This is local compilation evidence, not a new testing infrastructure environment. Fresh result: **145 unit tests PASS, TypeScript PASS, ESLint PASS, clean production-style Webpack build PASS**. Evidence: `.local/safe-checks-20261021T101933725121Z/`; canonical source and dependencies preserved. Build fallback/prerender success does not prove live content.

Separately, the minimal F01 **offline-final-v3** candidate remains exactly verified: **19 publish files**, **20 focused F01 tests**, **132 full candidate tests**, type/lint/network-denied clean build PASS. These passing results are reused after identity checks; canonical preview-related tests intentionally differ from the minimal candidate. All **497 retained candidate artifacts** rehash correctly in its configured `.next-offline-final-v3` directory.

| Candidate identity | SHA-256 |
| --- | --- |
| Publish manifest | `7f8e8c18d51b90e525b353cb18eb5708cc5db0deaab62ab777548bc276f2f9fd` |
| Binary-capable patch | `1dc84baa9381da02d4f4eb55709ec5a970a82f4be44b67a6c1ce520656464490` |
| Artifact manifest | `3151868bcaf6e8b71d4368e27b84b6c17e010d0b5281889e72e5d01b72a186df` |

The v3 candidate extends v2 only with the additional offline test; earlier reports headed v2 remain historical. Its runtime publish set excludes preview modules/flags, dotenv, private evidence, credentials, backups and browser profiles. Canonical development safeguards are preserved locally and must not be accidentally bundled via the whole working tree.

## F01 preparation closure and SQL reconciliation

**Preparation COMPLETE. Implementation PENDING, not approved or automatically scheduled.** Read the final offline/checklist/approval/candidate/build/recovery reports. Local static review prefers this exact set:

| Stage | Preferred review candidate | SHA-256 |
| --- | --- | --- |
| F01-00 | [controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed](security-proposals/phase-a/controlled-expansion-v1/F01-00-cms-key-compatibility.sql.proposed) | `52a520dc7f3d323ad8e4b037f6b8a36c61803233793866449a80dbc6cb2604ae` |
| F01-01 | [offline-hardening-v2/F01-01-exact-rpc-acl-v2.sql.proposed](security-proposals/phase-a/offline-hardening-v2/F01-01-exact-rpc-acl-v2.sql.proposed) | `85d264c3f8daea65ba3a18645cf9e35fb022692a5e438406372ff2008593cd4d` |
| F01-02 | [offline-hardening-v2/F01-02-guarded-contraction-v2.sql.proposed](security-proposals/phase-a/offline-hardening-v2/F01-02-guarded-contraction-v2.sql.proposed) | `2c75705cae58221c4f1abb7cd65af03c415abfae28ea7b234151f07179514c46` |

F01-00 guarded v1 preserves the exact ten-key CHECK expansion: original eight plus `book` and `global`; no seed/backfill. F01-01 v2 retains the reviewed read/save bodies and baseline guards, adding rejection of unexpected function grantees/default grants and authenticated grant options. F01-02 v2 retains the intended table-and-column contraction and published-only policy while adding schema/role/RPC fingerprints and final effective-privilege assertions. These are preferred static-review candidates, **not installed, parser/runtime-tested or execution-approved**. The earlier approval package's hashes are not silently substituted.

Original proposals remain unchanged:

| Original file | SHA-256 |
| --- | --- |
| F01-00-cms-key-compatibility.sql.proposed | `b5641ba534d742f95fd38b2c7a2ec44d539b1a88fce320a5fcb3d98a4f3d6d13` |
| F01-01-cms-rpc-expand.sql.proposed | `4b42aed3841135e2fc0fb14d4ceea01d2510c7714cb99e41a34d980bb30f6760` |
| F01-02-cms-privilege-contract.sql.proposed | `0d5dfb0ecfa63a104d56b81fe9a513cce9bf7e02ce276f09259559a99f8faadc` |

Guarded-v1 F01-01 also remains preserved: `74128a10917c7f17fe0c1530655e058d8de0418fd682ce28af1031cd8783254a`. No proposal was edited, renamed into migrations or executed.

Static checks retain per-file BEGIN/COMMIT, 3-second lock/30-second statement limits, postgres-owned private SECURITY DEFINER functions with empty search_path, active O/M/E property authorization through the existing trusted helper, and authenticated-only RPC execution. Exact signatures are `borealis_admin_cms_documents(uuid,text DEFAULT NULL)` and `borealis_save_cms_document(uuid,text,jsonb,public.content_status)`. Draft save preserves published data; publish atomically merges then clears draft. Expansion installs functions without calling the save function. Transactional schema-cache notifications are already included. Expansion alone leaves the existing table exposure open until contraction.

Remaining live gates: independent PostgreSQL parsing/review and guarded execution acceptance; fresh target/default-grant/inheritance/dependency fingerprints; real anonymous/JWT/nonmember/disabled/O/M/E/cross-property tests; rollback/merge/concurrency acceptance; compatible release identity; authoring/session drain; schema-cache visibility; actual public/private cache and preview checks. Exact deparser/body guards can reject benign version/format drift: stop for review rather than weakening guards. Mocked authorization is not PostgreSQL authorization.

Do not enable the patched private CMS/admin/preview paths against the existing database before expansion. Future same-project HTTP tests must not temporarily publish fixture content that public readers can select. Rollback-only SQL fixtures and independent HTTP sessions have different visibility; plan both explicitly. No real or synthetic live save/publish ran.

## F02, F03 and recovery status

**F02 narrow ACL correction IMPLEMENTED and historically independently verified:** anon/authenticated/PUBLIC cannot execute `next_booking_reference(uuid)` or `expire_booking_holds(uuid)` directly; postgres/service_role retained. Intended booking entry points retained public EXECUTE. Historical post-commit and final-approval evidence remain present. No new live check or full booking/concurrency/notification acceptance is claimed.

**F03 PENDING:** legacy email-based Storage/media permissive policies remain; active membership/property scope, authenticated hero-upload compatibility, operation-context support, old signed-capability drain, legacy paths and recovery need acceptance. Existing 10 MiB bucket versus 24 MiB UI mismatch needs an explicit product decision. No account/object/policy change was made.

Encrypted database and role exports retain hashes `fb214fca3e466db4318981f6624a2871819b294939d4217f266f950a2c271123` and `374fce3fa5fae8b3d81bd81108aada7f102864cc6f55f320fc619d89869a4a21`. Owner package ZIP rehashes to `daf5eeff8c5876c33436cd1afc8427e2a39457c843aaca162c772ca90793b90c`. Snapshot: **21 October 2026, 08:50:01 UTC**; it is not a continuously current backup.

Existing coverage: 60 public/27 Auth/8 Storage tables and role/ACL metadata; all 71 inventoried public media objects, 88,411,326 bytes, encrypted/checksummed. Prior complete AES-GCM authentication and Keychain access passed; this task rechecks ciphertext identity, not a restore. Three pending hero originals were absent and remain documented. No private media or key was exported. Full restore, off-Mac retention, independent key recovery and complete platform configuration recovery remain **NOT PROVEN**. These are release/recovery gates, not reasons to restart local-development infrastructure preparation.

## Focused architecture readiness

Foundations below exist in canonical source; this is a bounded connection check, not a repeat audit or functional certification.

| Area | Existing foundations | Local work / remaining live acceptance |
| --- | --- | --- |
| Public website | `src/app`, `src/components/public`, public repositories | Components, navigation, styling and fixture readers can be tested offline; real browser/layout/content remains separate |
| Admin | `src/app/admin`, `src/lib/admin/auth.ts`, admin repositories | Validation/forms/mock delegation locally; real Auth roles/writes need approval |
| CMS/translations | site actions, private CMS adapter, `services/site-content.ts`, language repository, translation services | F01 adapter/cache/error tests pass; SQL permission/publication and translation field connectivity remain pending |
| Rooms/availability | rooms/rates/availability repositories and database room/pricing services | Offline inputs/fixtures; actual inventory/rate transaction/concurrency tests pending |
| Booking | hold/confirm/experience API routes, booking service, pricing/occupancy/allocation | Unit/mock paths available; actual reservations, retries, abuse controls, currency and capacity pending |
| Experiences/transfers | respective admin repositories and database services | Offline field contracts/fixtures; live pricing/capacity/publish pending |
| Media | upload/hero routes, library, media repository/services | Offline validation/reference/UI work; Storage policy/byte/token acceptance pending F03/F06/F07 |
| SEO | `src/lib/seo.ts`, SEO repository, robots/sitemap routes | Metadata/origin fixture work; deployed origin acceptance pending |
| Notifications/integrations | notification service/Resend channel, iCal sync/internal routes | Fake adapters/feed fixtures only; real sends, schedules, payments and calendar sync require separate approval |

## Approved future development workflow

1. Understand the requested change and its public/admin result.
2. Inspect relevant canonical code and existing findings only; read relevant installed Next docs before code changes.
3. Make the smallest authorized local change; preserve unrelated files.
4. Run appropriate offline tests with the pinned workflow. Reuse validated artifacts only after source/dependency identity checks.
5. Verify the affected editor/reader/API contract with fixtures/mocks and clearly label live gaps.
6. Explain what changed, why and the evidence in plain English.
7. Keep required SQL/provider/configuration changes separate from the local patch.
8. Obtain separate task-specific authorization before live mutations, Git publication or deployment. Do not infer it from compilation or general test-platform ownership.

Routine frontend/admin work does not require a new infrastructure plan. No automatic F01/F03 implementation follows. The next local task can prepare F03's authenticated hero upload and explicit upload role gate using mocks, leaving policy changes/live Storage tests separate. Overall priority remains approved F01 implementation first; see [development priorities](BOREALIS-NEXT-DEVELOPMENT-PRIORITIES.md).

## Owner acceptance

| Question | Result |
| --- | --- |
| F01 preparation closed? | PASS — COMPLETE; implementation PENDING |
| Canonical workspace identified? | PASS — explicit canonical path; VS Code canonical window registered; older window preserved |
| Existing changes preserved? | PASS — file-hash inventory unchanged except the two requested new reports |
| Tests/build pass? | PASS — fresh canonical checks plus hash-verified minimal candidate |
| Safe for further local development? | PASS — scoped offline work; not unrestricted production-connected authoring or release |
| Production features verified? | PARTIAL — historical F02 ACL acceptance; F01/F03 runtime, booking, publication/cache, integrations and recovery remain unverified |
| Private material staged? | PASS — none staged; ignored private material preserved; review any future publish set |
| Next task? | Prepare the minimal F03 app compatibility patch offline; controlled F01 implementation remains first separately approved release task |
