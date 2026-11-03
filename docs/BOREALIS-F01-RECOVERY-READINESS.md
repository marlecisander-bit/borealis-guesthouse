# Borealis F01 — database backup and recovery readiness

2026-10-21 (Europe/Tirane). Existing project: `rlqyruulxyanfgvnzkpe`, borealis-guesthouse, organization `kywcwpvblqjgfhetefxx`, Free, eu-west-1. Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Encrypted logical export and non-destructive archive verification: PASS. Full recovery readiness: NOT PROVEN. F01 production implementation: NO-GO pending the remaining acceptance gates.** No database restore, F01 SQL, application change, publication or deployment occurred. No new environment, Docker operation, credential reset, Auth change or Storage mutation occurred.

## Connection and tools

Verified the existing project's dashboard identity and project-bound session-pooler connection. Native PostgreSQL **17.11** clients from the official Postgres.app 2.9.6 PostgreSQL-17 distribution were downloaded and checked against the release digest, code signature and individual binary hashes. The authenticated server reports PostgreSQL **17.6**, database postgres, with transaction read-only mode on. Only client programs ran; no local PostgreSQL server/database was initialized or started. The task-owned read-only client disk image was detached after verification; its checked download remains private for a reviewed remount.

The existing database password was entered through a hidden-answer Mac dialog, retained in process memory and child connection environments only, and discarded when each worker exited. It was not saved in a password file, command argument, report or chat. Connection details remain private. The client used `sslmode=verify-full` and Supabase's official CA downloaded from the dashboard; hostname/certificate verification was not relaxed. [Supabase SSL guidance](https://supabase.com/docs/guides/platform/ssl-enforcement).

An initial connection check failed before export. A later successful authentication exposed an overly strict local check: `pg_stat_ssl` describes the pooler-to-database backend, which reported false, rather than this Mac's TLS connection to the pooler. Corrected that check, retained libpq verify-full and recorded the separate backend observation. Do not claim end-to-end TLS across both hops. An encryption self-test name collision also stopped a local attempt before a connection; self-tests now use unique names. These were local preparation corrections, not database changes.

## Export and secure storage

The successful export began at **2026-10-21 08:50:01 UTC**. Private destination:

`.local/f01-recovery-readiness-v1/`

The directory is mode0700; encrypted exports are mode0600. `git check-ignore` confirms both exports are excluded by `/.local/`. No backup was staged or committed.

| Artifact | Process / encryption exit | Ciphertext size | SHA-256 |
| --- | --- | --- | --- |
| database.dump.enc | 0 / 0 | 1,149,028 bytes | fb214fca3e466db4318981f6624a2871819b294939d4217f266f950a2c271123 |
| roles.sql.enc | 0 / 0 | 6,075 bytes | 374fce3fa5fae8b3d81bd81108aada7f102864cc6f55f320fc619d89869a4a21 |

Executed native `pg_dump --no-password --format=custom --compress=0 --lock-wait-timeout=3s`, with connection parameters supplied privately, read-only sessions, a three-second lock timeout and a sixty-second statement timeout. The database export uses pg_dump's consistent logical snapshot. Normal ACCESS SHARE locks can conflict with DDL; this was not a lock-free export, and no load/performance certification is claimed. [PostgreSQL pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html).

Executed `pg_dumpall --no-password --roles-only --no-role-passwords` separately. Role and later catalog/media inventories are not part of the database dump's single snapshot. Password verifiers for database roles were intentionally omitted; this is not a credential backup.

Both outputs were piped directly into **AES-256-GCM encryption** with a random256-bit key, per-file random nonce and authenticated project/key identity header. No plaintext database archive was written to disk. The key was stored and read back through macOS login Keychain; harmless encryption/decryption and tamper-rejection tests passed. The private status records the Keychain item identifier. Do not expose/export the key in chat or logs.

This is a local encrypted copy only. Off-site retention, independent key escrow and recovery after losing this Mac/login Keychain have **not** been established. Both ciphertext and its usable key are required; copying only the backup folder does not establish disaster recovery.

## Verification and actual coverage

Authenticated decryption of the entire archive and role export passed. `pg_restore --list` exited0; full script generation to `/dev/null` also exited0. Neither operation used a database target. The first streaming-list verifier stopped before completing decryption because listing does not consume every archive byte; the corrected verifier authenticates the complete archive in memory before inspection. It does not repeat the export or connect to the database. [PostgreSQL pg_restore modes](https://www.postgresql.org/docs/17/app-pgrestore.html).

| Coverage check | Result |
| --- | --- |
| Live public tables versus archive | 60/60; no missing table definitions |
| Live Auth tables versus archive | 27/27; no missing table definitions |
| Live Storage tables versus archive | 8/8; no missing table definitions |
| Archive data entries | 103 TABLE DATA entries across exported schemas; each of the95 public/Auth/Storage tables has a corresponding data entry |
| Policy / ACL entries | 115 policy entries; 456 entries containing ACL |
| Trigger / constraint entries | 79 trigger entries; 377 entries containing CONSTRAINT |
| F01 dependencies | cms_documents definition and data, both existing CMS policies, membership/lifecycle helpers present |
| F02 dependencies | Both helper definitions present; restricted effective permissions independently rechecked |
| Non-built-in roles | 15/15 CREATE ROLE statements present |
| Memberships | 21 explicit non-built-in membership edges captured; three built-in pg_monitor edges depend on matching PostgreSQL initialization |
| Role passwords | Omitted deliberately |
| Ciphertext SHA-256 and file permissions | Independently rechecked after export |
| Actual restore / application recovery | NOT TESTED; no restore executed |

The three built-in membership dependencies are pg_read_all_settings, pg_read_all_stats and pg_stat_scan_tables granted to pg_monitor. Catalog inventory has24 edges; the role export also contains one parameter-privilege GRANT. Do not interpret22 total GRANT statements as22 membership edges. Platform-owned roles/grants must be reconciled on recovery rather than replayed blindly.

Captured extension dependencies: plpgsql1.0, pg_stat_statements1.11, uuid-ossp1.1, pgcrypto1.3, supabase_vault0.3.1 and btree_gist1.7, with their schemas. A logical dump does not package extension binaries, platform encryption keys, Auth/Storage server configuration, OAuth/provider secrets, project signing configuration, network settings or hosting integrations. Matching supported Supabase services remain recovery dependencies. Vault ciphertext does not establish recoverability of the platform's encryption key.

Private evidence includes client verification/download metadata, export status, encrypted TOC, encrypted catalog/role-media inventories, aggregate Storage inventory, coverage verification and an encrypted-artifact checksum manifest. Reports contain no customer, account, draft or media payloads. The archive itself necessarily contains sensitive database data and must remain private. Table/TOC coverage and successful parsing do not prove row-by-row restoration, runtime authorization or business correctness.

## Bounded Storage recovery inventory

Executed bounded READ ONLY dashboard queries with a ten-second statement timeout. SQL Editor automatically saved an untitled query draft; no explicit Save/Share action or database mutation was requested.

- One bucket: public-media; public delivery;10MiB limit; JPEG/PNG/WebP/AVIF.
- **71 objects, 88,411,326 recorded bytes; zero missing size metadata.** These are metadata-reported sizes, not independently downloaded-byte measurements.
- **64 media_assets references**, all matching an existing bucket/path in storage.objects at inventory time.
- **Four hero records with original paths and four non-null variant descriptors.** Non-null descriptors are not proof every derived variant exists or decodes correctly.
- Original/object paths, timestamps and variant identities remain in the encrypted database metadata; a digest of the current public-object identity set was captured. No object bytes were downloaded or checksummed. No unpublished CMS payload was separately inspected.

The dump contains Storage metadata, not object-store bytes; deleting an image cannot be repaired from this dump alone. [Supabase backup limitations](https://supabase.com/docs/guides/platform/backups).

Prepared media-byte procedure, **not executed**: derive an exact allowlist of the71 public-media bucket/path identities from the encrypted metadata; include every referenced original and each hero variant without inventing paths; reject other buckets, traversal and redirects; GET only those already-public object URLs over HTTPS; stream each response to a new owner-only encrypted file; compare metadata size/content type, compute a plaintext SHA-256 in memory, and store the path/version/checksum manifest encrypted. Verify full decryption and checksums without writing plaintext. Record concurrent object/version changes as failures requiring review. No listing-based wildcard download, deletion, move or private-bucket download is authorized by that procedure. Upload/restoration requires separate authorization and a reviewed conflict/CDN-cache plan.

## F01 release prerequisites rechecked

The three proposed SQL file hashes and eight-file local patch manifest still match the prior preparation evidence. No SQL candidate was executed:

1. F01-00: admit exactly the ten application keys; current live constraint still permits the original eight. No seeding/backfill or historical migration replay.
2. F01-01: authenticated, active O/M/E property-scoped private read/save RPC expansion. Live private read RPC remains absent. Patched admin/preview paths must not be released before expansion exists and is accepted.
3. Compatibility application: prior134 tests, TypeScript, ESLint and controlled production-style build remain historical passing evidence; this task verified unchanged patch hashes, not a fresh test/build run.
4. F01-02: only after compatible application acceptance and authoring-session drain, contract table/column privileges and published-only policy. No automatic restoration of broad draft access.

Fresh effective checks show anon/authenticated still denied direct execution of both F02 helpers; postgres/service_role retain it. Existing Netlify auto-publishing from main remains on, and the observed published revision still matches745b4aa56589cda5e5d0c8823ccc1cabb055e313. No toggle, push or deploy occurred. A future main push would therefore be a deployment action and requires a reviewed source-only publication set. The existing unrelated dirty files were preserved.

## Recovery limitations, maintenance and decision

**NO-GO for claiming a verified restorable baseline or implementing F01 under this task.** Export/archive verification succeeded, but no actual restore, independent off-site/key recovery or media-byte recovery was verified. Auth/Storage platform configuration and privileged ownership/extension restoration require a supported recovery procedure. Existing F01 draft-column exposure remains unchanged.

No duplicate environment or live restore is proposed. Within the owner's no-new-environment restriction, non-destructive archive inspection is the verification ceiling achieved here. A recovery drill requires a separately agreed method; this report does not silently require or create another database.

F01 cutover still requires fresh schema/ACL drift checks, SQL authorization/transaction acceptance with approved synthetic fixtures, expansion → compatible release → authoring maintenance/drain → contraction, and public/private/cache acceptance. Keep expanded RPCs and an RPC-compatible release available. If authoring fails, pause it and forward-fix the reviewed function/application path; preserve public published reads. Do not automatically replay broad old grants, restore the entire archive into the populated project, or narrow the key constraint by deleting content. Recovery and disclosure cannot be undone by a blanket rollback.

**Exact next action/authorization:** select an owner-controlled encrypted off-site destination and secure independent key-recovery method, and authorize copying only these encrypted artifacts/key escrow through that secure channel; optionally authorize the bounded public-media byte backup above. Agree on a recovery-verification method compatible with no new environments. Only after explicitly resolving the remaining recovery limits should a separate instruction authorize the exact F01 expansion, identified synthetic role/transaction tests and cleanup, source-only deployment, and conditional contraction. No production implementation follows automatically from this report.
