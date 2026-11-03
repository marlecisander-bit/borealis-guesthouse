# Borealis Phase A — synthetic test matrix

2026-10-21 (Europe/Tirane). **All 55 cases NOT RUN. Preparation only.** No synthetic account, booking, object or application patch was created.

## Fixture and assertion contract

Use properties A/B; distinct active owner/manager/editor/staff, disabled former editor, non-member, legacy-email-only identity and owner-A/staff-B multi-property identity. Use only new DEV Auth-issued JWTs. Fixed fixture aliases/UUIDs are defined in [fixture-contract.json](security-proposals/phase-a/validation/fixture-contract.json); they are not real accounts. Public published content and different private draft markers must be synthetic and assertable without printing their bodies.

Room/multi-room/experience fixtures need valid inventory, capacity, rates, settings, future/expired holds, reference counters and notification dependencies. Use EUR initially to avoid the separate known ALL currency defect confounding these security cases. Disable provider delivery/calendar execution. Synthetic raster uploads must include normal, hero-original, variant and legacy-format paths. No production data export or Storage copying.

Before correction, reproduce only the isolated baseline weaknesses: draft select allowed on a published fixture, direct helper execution changes only synthetic counters/holds, legacy-email-only Storage membership can permit writes. Exact before behavior depends on recorded grants/platform; record discrepancies instead of forcing them. After correction, assert the expected outcomes below. Positive controls must work so a broken endpoint cannot masquerade as secure denial.

For each denied mutation inspect authoritative synthetic row counts/state, object existence and byte hashes, not status alone. Expected REST errors may vary between denied permission and RLS-hidden rows; assert no unauthorized result/side effect and record actual codes. Concurrent transaction cases require independent clients and deterministic barriers. Authentication refresh and stale JWT tests must not use service-role credentials.

## Cases

| ID | Channel / actor | Scenario | Required after correction |
| --- | --- | --- | --- |
| F01-01 | REST table; anon | Published explicit approved projection | Published synthetic data visible; draft marker absent |
| F01-02 | REST table; anon | Explicit draft_data and wildcard selection on published row | Draft column denied; no private bytes; do not require wildcard to succeed |
| F01-03 | REST table; anon | Unpublished and archived row selection | No unpublished row or draft material |
| F01-04 | REST/RPC; authenticated non-member | Private table/RPC reads | Denied or empty per contract; no draft bytes |
| F01-05 | REST/RPC; staff/disabled/legacy-only | Private read/save attempts | Denied despite legacy email or stale role claims |
| F01-06 | RPC/app; owner/editor A | Private list/key read and draft preview | Own-property published and draft fixture available only to authorized caller |
| F01-07 | RPC/app; manager A | Same-property CMS compatibility | Authorized active role follows reviewed O/M/E contract |
| F01-08 | RPC/app; editor A | Save draft on published document | Public data/status unchanged; private draft updated; atomic result |
| F01-09 | RPC/app; editor A | Create draft then publish | New draft not public; publication exposes intended merged public data; clears draft |
| F01-10 | RPC/app; editor A | Publish failure and concurrent save | No partial state; concurrency contract explicit; retain prior public version |
| F01-11 | RPC; editor A | Read/save property B | Denied; no B row change or existence leak beyond contract |
| F01-12 | REST table; owner/editor A | Direct INSERT UPDATE DELETE including mixed columns | Denied after contraction; use authorized RPC only |
| F01-13 | REST table; anon | Public reads after save and publish | Draft does not enter shared cache; new published value visible after intended invalidation |
| F01-14 | app/cache; owner then anon | Authenticated preview followed by anonymous request | Private response no-store; no shared cached draft; anonymous public response remains clean |
| F01-15 | SQL/catalog; fixture administrator | ACL inheritance column/view exposure and definer ownership | No alternate grant/view/function path to drafts; owner/search_path matches approved contract |
| F01-16 | RPC; editor A | book/global on recorded eight-key baseline | Expose expected constraint failure; require reviewed key delta before compatibility PASS |
| F01-17 | RPC; editor A | Unknown key malformed status/null input and dependency failure | Fail closed without public partial update; no arbitrary document contract expansion |
| F02-01 | REST RPC/SQL; anon | Call next_booking_reference(uuid) directly | Permission denied; counter unchanged |
| F02-02 | REST RPC/SQL; authenticated O/M/E/staff/non-member | Call reference helper directly | Denied even for application editors; counter unchanged |
| F02-03 | REST RPC/SQL; anon/authenticated | Call expire_booking_holds(uuid) directly | Denied; no booking/items/reservation side effect |
| F02-04 | RPC/application; synthetic public guest | Room hold and confirmation nested reference path | Legitimate reviewed transaction succeeds with one intended reference/reservation |
| F02-05 | RPC/application; synthetic public guest | Multi-room transaction | All intended rooms committed atomically; references follow contract; no partial reservation |
| F02-06 | RPC/application; synthetic public guest | Standalone experience transaction | Legitimate nested path works; capacity and reference contract maintained |
| F02-07 | RPC/application; synthetic public guest | Package/add-on path | Reviewed public entry point remains allowed; helper remains directly denied |
| F02-08 | RPC/SQL; trusted DEV maintenance identity | Expire synthetic held booking | Only eligible expired held fixtures expire; future/confirmed and other-property fixtures preserved |
| F02-09 | RPC/SQL; trusted nested owner | Booking path invokes expiration | Effective definer owner retains access; no accidental public grant required |
| F02-10 | concurrent RPC; synthetic guests | Parallel successful booking references | Unique references; no duplicate allocation; gaps not mistaken for integrity failure |
| F02-11 | SQL/catalog; fixture administrator | PUBLIC inherited roles overloaded signatures and default ACLs | No unexpected execute path; exact signature revocation only; unrelated public RPCs preserved |
| F02-12 | transaction failure; synthetic guest | Nested helper/caller error | Whole intended booking transaction rolls back; evidence includes counters and reservations |
| F02-13 | REST RPC; anon/authenticated | Direct PostgREST bypass of application | Same denial independent of UI/Next route; no mutations after failed call |
| F03-01 | Storage HTTP+REST; owner/manager/editor A | Ordinary upload and metadata insert | Same-property valid raster object/metadata succeed without admin_users membership |
| F03-02 | Storage HTTP+REST; staff/non-member/disabled/legacy-only | Insert overwrite delete and metadata CRUD | Denied; object existence/byte hashes and metadata unchanged |
| F03-03 | Storage HTTP+REST; editor A | Upload/read-list/update/delete property B | Denied for authenticated protected operations; public image GET remains intentionally public |
| F03-04 | Storage HTTP+REST; editor A | Metadata bucket/prefix/property mismatch | Denied; changing metadata property alone cannot escape boundary |
| F03-05 | Storage HTTP; editor A | UPDATE source and destination path/property | Both checked; cross-property rename/copy/move remain unsupported/denied |
| F03-06 | Storage HTTP; editor A | Root bad UUID uppercase dot dotdot repeated slash percent backslash trailing slash | Fail closed without cast error or object side effect |
| F03-07 | app+Storage HTTP; owner/editor A | Hero start authenticated upload finish and variant generation | No signed token returned; own JWT upload works; finish rechecks role/path/type/size; variants and metadata consistent |
| F03-08 | app+Storage HTTP; disabled after hero start | Finish and new authenticated upload after disable commit | New authorization checks deny after committed disable; record in-flight limitations |
| F03-09 | Storage HTTP; enabled editor A | Call signed-upload creation directly bypassing app | Denied at service operation policy; no new signed capability |
| F03-10 | Storage HTTP; synthetic user with pre-change token | Mint synthetic token before policy change and disable | Characterize actual behavior; no immediate revocation claim; record issuance cutoff and expiry |
| F03-11 | Storage HTTP; old token and old JWT | After verified maximum token lifetime plus margin/drain | Old token cannot complete upload; disabled user JWT cannot write |
| F03-12 | public Storage HTTP; anon | Known synthetic public image URL before/after | Stable URL and byte hash; no auth requirement; publicness is intentional |
| F03-13 | Storage HTTP+REST; editor A | Root/unprefixed historical-format synthetic object | Public GET retained; edits denied or explicit reviewed compatibility; no automatic move |
| F03-14 | Storage HTTP; editor A | Supported SDK upload overwrite list/download info remove | Expected operation names/context verified on actual server; appropriate own-property operations pass |
| F03-15 | Storage HTTP; editor A | Signing signed completion copy/move S3 TUS/resumable unknown context | Excluded routes deny; no helper/context emulation used as server evidence |
| F03-16 | Storage HTTP+REST; owner A staff B/multi-property | Membership combinations | Only properties with active O/M/E membership writable; owner A does not upgrade staff B |
| F03-17 | app+Storage HTTP; editor A | Metadata failure and object cleanup failure | Compensation checked; orphan/error observable; no privileged retry or unintended delete |
| F03-18 | app+Storage HTTP; editor A | 10 MiB bucket and 24 MiB hero UI boundary | Boundary documented and tested; no silent limit increase; incompatible size prevents PASS |
| F03-19 | SQL/catalog+HTTP; fixture administrator | All effective policies/grants/helper ownership and public bucket | No surviving permissive legacy bypass; public reads preserved; managed operation helpers match version |
| ENV-01 | guard; operator | Missing target or production endpoint/key inherited | Abort before connection/mutation; no automatic fallback |
| ENV-02 | guard; operator | Proposal hash schema owner or platform drift | Abort before applying any delta |
| ENV-03 | restore; DEV administrator | Recreate synthetic baseline and compare schema fingerprints | Reproducible defaults constraints functions owners ACLs policies and fixture version |
| ENV-04 | transaction; DEV administrator | Lock timeout/statement failure during each proposed delta | Whole transaction rejected; no partial policy/ACL state |
| ENV-05 | recovery; DEV administrator | Rehearse secure pause/forward repair for each finding | Public continuity where intended; no automatic insecure permission restoration |
| ENV-06 | evidence; operator | Sanitization and provider/target trace | No production target/provider send; no secret/body/token in evidence; every missing test NOT RUN |

## Execution order and acceptance

Admission/restore gates → baseline observations → F01 expansion and compatible app tests → F01 contraction tests → F02 exact ACL transaction and nested call tests → F03 authenticated compatibility and actual Storage tests → real capability expiry/drain observation → secure recovery rehearsal. Recreate known synthetic checkpoints between destructive scenarios; never weaken policies to clear a failed test.

F01 cache acceptance requires a reviewed isolated application build and requests through the actual cache/preview paths; SQL queries alone cannot certify it. F02 needs actual DB/REST transactions and known effective owners, not mocks. F03 needs the real isolated Storage service and object store; manually setting SQL operation context is not equivalent. Preserve expected public-bucket reads while denying protected listing/writes.

Evidence per case: target reference/version and proposal hash, timestamp, fixture actor alias, channel, sanitized status/assertions, pre/post row counts and synthetic object hashes. Keep JWTs, passwords, signed capabilities and response bodies out of reports. Capture provider/egress observations within the test environment; absence of a UI error is not proof of no unexpected requests. Unobservable properties stay NOT ESTABLISHED.

A finding passes only when all required positive/negative/compatibility/recovery cases pass on recorded versions. The CMS eight-versus-ten key conflict and hero 10-versus-24 MiB conflict are explicit blockers. No test result or production safety claim is implied by this prepared matrix. See [promotion gates](BOREALIS-PHASE-A-PRODUCTION-PROMOTION-GATES.md).
