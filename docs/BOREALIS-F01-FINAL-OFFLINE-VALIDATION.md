# Borealis F01 — final offline validation

21 October2026, Europe/Tirane. **Offline validation PASS. Production implementation readiness: NOT ESTABLISHED; no live stage completed.** The owner selected PREPARATION ONLY. No production database connection, SQL execution, browser/remote lookup, private RPC call, account/fixture/data/Storage mutation, server startup, Git publication, Netlify or Docker operation ran. No production authorization is requested by this report.

## Local artifacts and historical evidence

Read the six requested readiness/recovery/cutover reports and used local evidence only. Verified the previous18-file v2 candidate, all six pinned font asset/license/metadata hashes, retained provenance, encrypted package checksums and historical F02 post-commit evidence. The existing F02 record retains anon/authenticated denial and postgres/service_role access; this is **recorded historical evidence, not a new production permission check**.

| Existing SQL | SHA-256, unchanged |
| --- | --- |
| Original F01-00 |b5641ba534d742f95fd38b2c7a2ec44d539b1a88fce320a5fcb3d98a4f3d6d13 |
| Original F01-01 |4b42aed3841135e2fc0fb14d4ceea01d2510c7714cb99e41a34d980bb30f6760 |
| Original F01-02 |0d5dfb0ecfa63a104d56b81fe9a513cce9bf7e02ce276f09259559a99f8faadc |
| Guarded expansion-v1 F01-00 |52a520dc7f3d323ad8e4b037f6b8a36c61803233793866449a80dbc6cb2604ae |
| Guarded expansion-v1 F01-01 |74128a10917c7f17fe0c1530655e058d8de0418fd682ce28af1031cd8783254a |

Existing database ciphertext remains `fb214fca3e466db4318981f6624a2871819b294939d4217f266f950a2c271123`; roles ciphertext remains `374fce3fa5fae8b3d81bd81108aada7f102864cc6f55f320fc619d89869a4a21`. Encrypted media-manifest SHA-256: `fe689aec88215fb43fc522432e928956a84ba0ee92c6eda504548ccb072636c0`. Re-authenticated the package through local Keychain under OS-denied networking:76 encrypted files PASS,71 objects/88,411,326 bytes match the encrypted manifest. No plaintext backup/key export or restore occurred. Private files remain Git-ignored.

Coverage and limitations remain those of the existing package:60 public/27 Auth/8 Storage tables,15 non-built-in roles, three missing pending hero originals, no proven restore/off-Mac/key recovery and no complete managed-platform configuration recovery. Backup age/current database drift was not refreshed against production. Integrity is not proof that the snapshot contains later edits or that disaster recovery works.

## SQL static review and separate revisions

Reviewed exact signatures, dependencies, ten keys, per-unit BEGIN/COMMIT,3-second lock/30-second statement limits, trusted ownership, empty private-function search_path, auth.uid/property/active O/M/E checks, grants/revokes, merge semantics and error/rollback boundaries. F01-00 changes only a CHECK. F01-01 installs future read/save functions without invoking their writer. Draft save preserves existing published data/status; publish merges and clears draft. F01-02 removes table AND column access before granting only the five public columns and a published-row policy. The private functions deliberately return private material only after authorization; they do not make the old table exposure disappear during expansion.

Function bodies, SQL guards and notifications were read as text only. Named dollar quoting, transaction boundaries and unchanged body checks pass. **No PostgreSQL parser, SQL compilation, DDL rehearsal, RLS or transactional database execution ran.** A mocked model is not a substitute. The already-recorded F01-01/F01-02 transactional schema-cache notifications remain present; none was sent.

Two hardening gaps were identified; no exploitation is asserted:

1. Expansion-v1 checks selected effective roles but does not reject every possible unexpected default function grantee or authenticated grant option. This is not proof of anonymous exposure because function membership checks still apply; it leaves exact least-privilege acceptance incomplete.
2. Original F01-02 has the intended privilege/policy delta but lacks exact in-transaction baseline guards and comprehensive effective final-privilege assertions. External freshness/release checks remain necessary even with guards.

Original files and approval hashes were preserved. Separate **unapproved, unexecuted** candidates were created under `docs/security-proposals/phase-a/offline-hardening-v2/`:

- [F01-01 exact ACL assertion](security-proposals/phase-a/offline-hardening-v2/F01-01-exact-rpc-acl-v2.sql.proposed): `85d264c3f8daea65ba3a18645cf9e35fb022692a5e438406372ff2008593cd4d`. Rejects unexpected grantees/default grants and ordinary authenticated grant options before commit; it does not silently revoke unknown grants or change function bodies.
- [F01-02 guarded contraction](security-proposals/phase-a/offline-hardening-v2/F01-02-guarded-contraction-v2.sql.proposed): `2c75705cae58221c4f1abb7cd65af03c415abfae28ea7b234151f07179514c46`. Adds exact local-evidence-derived baseline guards, installed RPC body/security/ACL requirements and final effective table/column/PUBLIC/policy/RLS assertions.

Their diffs, manifest and [scope notes](security-proposals/phase-a/offline-hardening-v2/README.md) are adjacent. These are structural proposals requiring independent review/parsing and future fresh metadata. Exact body/policy-deparser fingerprints can reject harmless version/format changes; stop for review rather than weakening them. Default privileges must be inventoried when future live preflight is authorized. SQL cannot prove deployment identity, authoring drain or cache behavior. Do not substitute these new hashes into the earlier approval package automatically.

## Expanded offline regressions

Added only `tests/cms-security-offline.test.ts` to canonical test code; canonical application source is unchanged. Eleven new cases run actual adapters/actions/cache/booking code against deliberately explicit synthetic models/stubs:

- Anonymous and nonmember denial; hypothetical final public projection excludes drafts.
- Active owner/manager/editor access; staff local rejection; disabled/stale/forged membership rejection by the mock backend.
- Cross-property read/save rejection and unchanged model state.
- New draft, repeated merge, publish/clear and simulated pre-commit failure preservation.
- All ten valid keys; invalid keys/status/JSON values make zero delegate calls.
- RPC errors/malformed IDs fail closed without direct-table fallback.
- String/URL/Request private requests override public force-cache/tags and retain cancellation behavior.
- Real action plus revalidation wrapper expires CMS tags only after successful publication; draft/error paths do not invalidate public data.
- Actual booking client's hold/confirm API and synthetic token flow stay unchanged; it makes no direct internal helper request.
- Private adapter reads are fresh rather than shared-memoized.

**What this proves:** application delegation, error/caching behavior and consistency with a model of the intended contract. **What it does not prove:** real anon/JWT role resolution, active membership RLS, PostgreSQL ACL/default privileges, nested SECURITY DEFINER execution, locks/concurrency, actual publish atomicity or production caches. The model's final projection represents post-contraction intent, not current production grants. F02 compatibility is mocked client-path evidence plus preserved historical ACL records, not a new booking transaction test.

## Fresh test/build and release inventory

Node20.19.5, Next16.3.4; existing dependencies. Every suite/type/lint/build child ran under OS `deny network*`, sterile environment, no privileged/deployment/provider credentials and no preview flags. No dotenv was copied. No network exception was added. This is a private compilation snapshot inside the existing workspace, not a new database/server/hosting environment.

| Check | Result |
| --- | --- |
| Focused F01 suite |20/20 PASS |
| Complete v3 candidate suite |132/132 PASS |
| Complete canonical suite |145/145 PASS |
| Skipped/failed tests |Zero |
| TypeScript noEmit / ESLint |PASS |
| Clean normal production-style Webpack build |PASS; exit0; no prior output |
| Artifact integrity |497 paths/hashes recorded and rechecked |
| Local emitted fonts |Two TTFs match verified sources |
| Dependencies |22,428 entries identical canonical/clone before and after |
| Canonical application src |Unchanged |
| Compiler edits |Only private-snapshot next-env.d.ts/tsconfig.json; excluded from publish set |
| Production/network connection |Not opened |

Private evidence: `.local/f01-offline-final-v3/`; prior v2 preserved. Build completed12:09:04 Europe/Tirane. New candidate keeps all18 v2 publish files unchanged and adds only the new offline test, for19 files. The unchanged F01-01 proposal is a static-test fixture outside migration discovery; hardening-v2 SQL is not silently bundled into the application candidate.

| Identity | SHA-256 |
| --- | --- |
| publish-manifest.json |`7f8e8c18d51b90e525b353cb18eb5708cc5db0deaab62ab777548bc276f2f9fd` |
| F01-offline-final-v3.patch, binary-capable |`1dc84baa9381da02d4f4eb55709ec5a970a82f4be44b67a6c1ce520656464490` |
| artifact-manifest.json |`3151868bcaf6e8b71d4368e27b84b6c17e010d0b5281889e72e5d01b72a186df` |

Exact intended publish files:

- `src/types/site-content-cms.ts`
- `src/lib/admin/cms-documents.ts`
- `src/lib/repositories/admin/site-content.ts`
- `src/lib/repositories/admin/languages.ts`
- `src/services/site-content.ts`
- `src/lib/supabase/fetch.ts`
- `src/app/admin/content/site-actions.ts`
- `tests/cms-draft-protection.test.ts`
- `src/app/layout.tsx`
- `src/app/fonts/cormorantgaramond/CormorantGaramond[wght].ttf`
- `src/app/fonts/cormorantgaramond/METADATA.pb`
- `src/app/fonts/cormorantgaramond/OFL.txt`
- `src/app/fonts/manrope/METADATA.pb`
- `src/app/fonts/manrope/Manrope[wght].ttf`
- `src/app/fonts/manrope/OFL.txt`
- `src/app/fonts/provenance.json`
- `tests/local-fonts.test.ts`
- `docs/security-proposals/phase-a/F01-01-cms-rpc-expand.sql.proposed`
- `tests/cms-security-offline.test.ts`

Publish hashes and reverse patch applicability pass. No development preview flag/module, credential, backup, browser profile, `.local/` material or generated build output is in the runtime publish inventory. Tests include mocks of the local preview transport solely to run across both source contexts; those are not production flags or modules. Git staging is empty; nothing was committed/pushed.

## Remaining blockers and recommendation

**Offline preparation PASS; production acceptance NOT PROVEN.** Remaining blockers: independent review/parsing of the new SQL revisions; fresh future metadata/default-privilege/exposure checks; unresolved restore/off-Mac risks; unexecuted real role/JWT/REST/save/publish/concurrency/cache tests; no deployed compatible revision or authoring drain; no F01-02/post-contraction acceptance. Current deployed F01 confidentiality is not changed by passing mocks or compilation.

Recommended next action is **offline review of the separate hardening revisions and selection of an immutable future SQL package**, using the [owner implementation checklist](BOREALIS-F01-OWNER-IMPLEMENTATION-CHECKLIST.md). Production actions remain future, separate stages. Do not execute anything automatically, create another environment, or request production mutation authorization as part of this preparation-only task.
