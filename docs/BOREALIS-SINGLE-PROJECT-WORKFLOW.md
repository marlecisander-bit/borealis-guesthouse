# Borealis existing-project workflow and first remediation

2026-10-21 (Europe/Tirane). **Owner selected the existing platform as the test environment. F02 narrow permission correction APPLIED and independently verified. F01/F03 remain open. No duplicate resource created; no source publication or deployment performed.**

## Owner decision and resource identity

The owner explicitly confirmed inspection, testing and work against the existing Supabase database, GitHub repository and Netlify site, declaring them test resources and requesting no duplication. This supersedes the earlier isolated-target-only authorization boundary for this workflow; it does not retroactively mark the isolated tests as passed.

- Supabase: `rlqyruulxyanfgvnzkpe`, borealis-guesthouse, Free, eu-west-1, PostgreSQL 17.6; Healthy.
- GitHub: `marlecisander-bit/borealis-guesthouse`, main `745b4aa56589cda5e5d0c8823ccc1cabb055e313`, independently read with git ls-remote.
- Netlify: `borealisguesthouse`, https://borealisguesthouse.netlify.app; published main revision is the same commit, deploy `6aa69097a30b800008847240`. Auto publishing from main is on. No trigger/toggle was changed.
- Previously created DEV `fnigbernzhnecprlbjpr` remains untouched and unused; no automatic deletion or additional project creation. Historical DEV-only guards are preserved rather than silently repointed.

The deployed Netlify site is already reachable over public HTTPS: all seven informational pages returned 200 anonymously. The owner's description of the project as test does not make the endpoint private. No privacy or visibility setting was changed.

## Fresh inspection and preservation

Two bounded metadata batches ran in READ ONLY transactions with a ten-second statement timeout against the exact existing project. They captured relevant function definitions/owners/ACLs, table/column grants, CMS constraints, seventeen policies, role membership and effective EXECUTE checks. No draft, guest, booking, account or object payload was selected. SQL Editor automatically created an untitled query draft; no explicit Save/Share action was invoked. Platform metadata/query logging is expected.

Pre-change definitions and ACLs are preserved privately in `.local/single-project-phase-a-20261021/`. These are **definition-level recovery evidence, not a full database/media backup**. The dashboard explicitly says Free does not include project backups, and the overview reports no backups. A full restorable export and recovery rehearsal have not been performed. No paid backup upgrade was selected.

Live checks reconfirmed F01: anon and authenticated have draft-column SELECT, the published-row policy still admits the row, and the CMS key constraint still lists only eight keys. No actual draft content was read. F03's legacy email-based Storage policies remain. The live database does contain official `storage.allow_only_operation` and `storage.allow_any_operation` helpers owned by supabase_storage_admin, but that alone does not certify operation-context behavior or signed-token revocation through Storage HTTP.

## F02 applied correction

Removed EXECUTE from PUBLIC, anon and authenticated on exactly:

- `public.next_booking_reference(uuid)`
- `public.expire_booking_holds(uuid)`

No function body, booking RPC, table data, account, sequence or counter was changed by this correction. Existing explicit service_role grants were retained, not newly broadened. Both helper owners are postgres; inspected direct booking callers are SECURITY DEFINER owned by postgres. Five public booking/confirmation entry points remain executable by anon and owned by postgres.

First rehearsed the exact revocations in a bounded transaction ending ROLLBACK. The rehearsal showed anon/authenticated denied and postgres/service_role retained, with five intended public entry points unchanged. Saved the pre-change definitions and tested SQL before applying. Then applied the same exact revocations in a transaction with ownership/trusted-grant preconditions, lock/statement timeouts and failure assertions before COMMIT. A subsequent independent READ ONLY batch verified the committed effective permissions.

| Role | Reference helper | Expiration helper |
| --- | --- | --- |
| anon | DENIED |
| authenticated | DENIED |
| service_role | RETAINED |
| postgres | RETAINED |

`create_booking_hold`, `create_booking_package_hold`, `create_multi_room_booking_package_hold`, `create_experience_booking_hold` and `confirm_booking_hold` retained public EXECUTE. No real or synthetic booking was invoked to demonstrate this. This is **ACL acceptance**, not complete booking/concurrency/notification acceptance or completion of the thirteen prepared F02 cases.

Recovery: preserve the restricted helper boundary. If an uninspected trusted caller fails, repair that reviewed trusted path or pause that operation; do not automatically restore anonymous helper execution. Original ACLs are evidence, not an approved insecure rollback script. Full data restore is not needed to undo this privilege-only delta, but no data recovery capability is claimed.

## Tests and HTTP checks

Existing canonical application suite: **125/125 PASS**, pinned Node 20.19.5, sterile environment, OS network denied. It is unit/static/mock/framework evidence; it is not the 55-case security suite.

Fresh GET-only requests to `/`, `/about`, `/rooms`, `/experiences`, `/transfers`, `/explore-koman` and `/gallery`: all HTTP200 HTML, no redirects or Set-Cookie. GETs to robots.txt and sitemap.xml also returned200 and still advertise localhost, confirming the previously recorded SEO origin issue. CSP was not present in these deployed responses; the local read-only preview CSP must not be inferred on this normal deployment. Response bodies were inspected transiently for these bounded assertions and not persisted.

No Auth login, draft read, upload, calendar feed, email send, payment or booking mutation test ran. No complete network-path or browser-layout acceptance is claimed.

## Local publication hygiene

Added only `/.local/` to root `.gitignore`, preserving existing entries. Private profiles, credentials, cache, build snapshots and runtime/evidence material must not enter a broad Git add. Existing tracked/untracked application modifications remain unchanged. No staging, commit, push, branch creation or deployment occurred. A push to main would auto-publish, so publication must use a deliberately reviewed source-only set.

## Minimal remaining same-project sequence

1. Preserve a restorable database export and media-object recovery inventory before content-affecting work. Export requires supported DB access/tooling; no password was requested or changed here. A logical DB dump alone does not include Storage object bytes. Do not claim the current definition snapshot is a full backup.
2. F01: implement and offline-test private CMS read/save compatibility, rehearse proposed RPC/policy transactions with synthetic rollback fixtures on this same project, preserve public reads, then coordinate expansion → application release → contraction. Decide the eight-versus-ten key contract explicitly; do not replay old seed migrations. Until contraction is validated/applied, draft confidentiality remains unresolved.
3. F03: implement authenticated hero uploads and ordinary role gate, review 10 MiB versus 24 MiB limit, use tightly identified synthetic fixtures on this same project, verify real Storage operation context and public-read continuity, then replace legacy policies with a bounded capability/in-flight drain. Do not disable real memberships, move existing objects or mint tokens against existing content to test revocation.
4. Review the final source-only diff, normal-mode build and deployment environment before using the existing GitHub/Netlify release path. No duplicate repository/site/database is needed. Match the existing public HTTPS origin for SEO rather than changing infrastructure.

The owner's existing-resource authorization persists; another database is not a prerequisite imposed by this report. Remaining technical dependencies are not a request to repeat that authorization. Historical isolated-only documents remain design/evidence records and must not be mistaken for the selected target's current execution state.
