# Borealis — recovery package result

21 October 2026, Europe/Tirane. Existing project `rlqyruulxyanfgvnzkpe`. **Database archive verification PASS; all71 inventoried public image objects backed up and verified. Disaster recovery NOT PROVEN. No live restore or production modification.**

## Existing database backup

Reused the original export from21 October2026 at08:50:01 UTC /10:50:01 Europe/Tirane. It was approximately13 minutes old when the successful media-backup run revalidated it; no new database dump was created. SHA-256, complete AES-256-GCM authentication, Keychain access, `pg_restore --list` and full SQL generation to `/dev/null` all passed again. No database target was supplied to pg_restore and no plaintext database archive was written to disk.

Previously established coverage remains60 public,27 Auth and8 Storage table definitions, with a data entry for each;15 non-built-in roles;115 policies and recorded ACL/trigger/constraint definitions. The original coverage inventory and extension requirements remain authoritative. This task did not rerun a full live schema audit. Role passwords are intentionally omitted. Three PostgreSQL built-in pg_monitor memberships depend on platform initialization; old role/grant SQL is evidence, not a replay script. [Prior coverage and limitations](BOREALIS-F01-RECOVERY-READINESS.md).

Original ciphertext hashes remain:

- Database: `fb214fca3e466db4318981f6624a2871819b294939d4217f266f950a2c271123`.
- Roles: `374fce3fa5fae8b3d81bd81108aada7f102864cc6f55f320fc619d89869a4a21`.

## Public-media backup

Derived the exact71-object allowlist by parsing the authenticated existing database archive in memory. Confirmed its bucket configuration,64 media_assets references and hero descriptors. No live SQL payload read, new dump, wildcard download, private-bucket retrieval or Storage write was used for this step.

Only anonymous HTTPS GETs to the exact existing Supabase host and `/storage/v1/object/public/public-media/` prefix were permitted. Path validation rejects traversal/ambiguous segments; redirects and unexpected destinations fail closed. Every response had HTTP200 and matching metadata size/type; recorded ETags were compared when present. Each download was streamed into a new AES-256-GCM file using the existing local key. Plaintext SHA-256 was calculated during retrieval, then checked after full authenticated decryption in memory. No plaintext image file was saved.

| Result | Evidence |
| --- | --- |
| Confirmed objects |71/71 retrieved, encrypted and verified |
| Image bytes |88,411,326; matches inventoried total |
| Existing media references |64/64 refer to inventoried objects |
| Ready hero |One original and all three variant paths resolve to inventoried objects and were backed up |
| Missing references |Three **pending** hero rows name originals absent from Storage; each has an empty variant list |
| Failed or inaccessible approved GETs |Zero |
| Object uploads/overwrites/deletes/moves |Zero |

The three pending originals were excluded rather than fetched using guessed paths. Their metadata is preserved in the encrypted inventory/database archive; no recovery bytes exist for them. They are a specific completeness limitation for pending hero state, not missing bytes among the71 existing objects. No pending row was fixed or removed. Current retrieval matching does not certify future object stability, rendering/decoding quality, or an atomic database-plus-object-store snapshot.

## Owner package

Private folder: `.local/recovery-completion-v1/owner-recovery-package/`.

Convenience ZIP: `.local/recovery-completion-v1/Borealis-owner-recovery-package-20261021.zip`.

The package contains encrypted database/role exports, encrypted TOC and exact object/reference inventory,71 encrypted media files, encrypted per-object checksum manifest, ciphertext checksums, platform versions, owner instructions, encryption helper and a local verification-only script. It excludes database connection configuration, credentials and the encryption key. File paths and actual image identities remain in encrypted manifests; reports contain aggregates only.

ZIP size:89,934,043 bytes. SHA-256: `daf5eeff8c5876c33436cd1afc8427e2a39457c843aaca162c772ca90793b90c`. ZIP CRC verification passed. The enclosing ZIP is a transport container; the backup/media payloads inside are encrypted, while instructions and ciphertext checksums are readable metadata. Keep the whole package private.

Package verification passed:76 encrypted files authenticated;71 media objects and88,411,326 plaintext bytes matched their encrypted manifest. Directory/file permissions and Git exclusion were checked; no staging or publication occurred. The owner package is mode0700 and exports/ZIP are owner-only. All outputs are under ignored `.local/`. Original evidence remains preserved.

To repeat verification on this Mac, ask Codex to run the package's `verify-package.py` with the reviewed Node executable. It uses the recorded Keychain service/account, authenticates files in memory, and never connects to a database, exports the key or writes plaintext. It requires macOS Keychain access plus reviewed Python/Node tooling. PostgreSQL17 clients are needed for an additional archive parse; their task-owned read-only client image can be remounted without starting a database. The verifier is not a restore program.

## Portability and recovery limits

**Can this package survive loss of this Mac today? Not established.** Neither package nor key has an independently verified off-Mac copy. Local Keychain access does not establish iCloud synchronization or disaster recovery. No key was exported, copied or escrowed; no cloud upload ran.

Apple supports copying eligible file-based keychains to another Mac when the keychain file and its password remain available. This is a supported recovery path only after separately authorized preservation and testing; it cannot recover an already-lost, uncopied keychain. No keychain was copied here. [Apple keychain transfer guidance](https://support.apple.com/guide/keychain-access/copy-keychains-kyca1121/mac), [Apple file-based keychain details](https://developer.apple.com/documentation/technotes/tn3137-on-mac-keychains).

Next portability authorization must identify an owner-controlled off-Mac ciphertext destination and a separate secure key-recovery method. Prefer preserving only the required recovery key through a reviewed secure channel rather than copying unrelated login-keychain secrets. Any key export/wrapping/escrow requires explicit authorization and must avoid chat/logs. No destination or key method was silently selected.

Actual database/media restoration, Auth/Storage service configuration recovery, extension/platform-key restoration and application recovery remain NOT TESTED. Do not restore into the populated live database to demonstrate readiness. No duplicate target was created. The package improves local recoverability but cannot certify a restore under the current no-new-environment/no-live-restore constraints. Future recovery must reconcile exact project/version/ownership/ACL state and obtain explicit restore/upload permission; no automatic broad-permission restoration is prepared.
