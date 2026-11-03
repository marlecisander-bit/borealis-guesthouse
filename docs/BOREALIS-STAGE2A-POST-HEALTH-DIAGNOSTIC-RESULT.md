# Borealis Stage 2A post-health diagnostic result

2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Diagnostic/resume preparation PASS. Historical failing operation remains unproven. No restart, live HTTP probe, SQL, network probe or infrastructure mutation occurred.** Five exact IDs remain exited, all volumes preserved. DB/Auth/Storage/Kong final exit0, REST final exit255 match the new baseline. REST255 is not independently attributed as the root cause.

## Read-only current-state verification

Verified required reports, sealed startup-v2 inputs and exact recovery-v2 IDs, normalized full configuration snapshots, cached image identities/local credential provenance and gateway bytes. All original/recovery volumes present; approved internal network identity unchanged with no peers. Only expected loopback DB54322/Kong54321 publication requests exist; five expected project containers, all stopped. No hosted-link marker found; production dotenv was not loaded. No volumes were mounted or database queried.

## Exact old verification sequence

| Stage | Operation / expectation | Timeout / failure |
| --- | --- | --- |
| Configuration | Seal/image/network checks; inspect five IDs and gateway file; running NetworkID exact, no peer outside owned IDs | Docker subprocess generally120s; policy validator20s; unexpected parse/file errors can escape |
| Service health | All five Running and Docker healthy | Named policy failure |
| Empty catalog | docker exec DB psql -U postgres -d postgres -At -v ON_ERROR_STOP=1; SELECT counts auth.users and public tables matching application blocklist | Docker120s; expected exact 0\|0; UTF-8 decode/parse/timeout exceptions possible |
| Auth HTTP | GET http://127.0.0.1:54321/auth/v1/health, local API-key/Bearer headers | urllib timeout5s; expected200; proxies disabled |
| Storage HTTP | GET http://127.0.0.1:54321/storage/v1/status, same local headers | timeout5s; expected200 |
| IPv4 denial | DB bash timeout3 /dev/tcp/192.0.2.1/443 | subprocess6s; nonzero AND stderr Network is unreachable |
| IPv6 denial | Same for 2001:db8::1 | Same requirement |
| Internal DNS | DB command -v getent and timeout3 getent ahosts auth | subprocess6s, expectedexit0 |
| External DNS | DB timeout3 getent ahosts example.com | subprocess6s, expectedexit2 or124 |
| Evidence | Write final health-evidence.json | File/serialization errors possible |

These are the only HTTP requests and SQL query in the inherited verifier. It does not execute application RPCs. Docker operations are read-only inspect/image inspect/network inspect/gateway cp-read plus authorized docker exec of local read/probe commands during future verification. Startup itself uses exact-ID start and owned stop, separately gated. No such live verification command was executed in this preparation.

The old handler turns non-Failure/Reject exceptions into startup_handoff_validation_failed. urllib HTTPError (including non200), URLError, socket timeout, subprocess.TimeoutExpired, decoding/JSON/file errors can therefore lose their stage/type. HTTP non200 usually raises HTTPError before explicit response.status comparison, so local_api_health_failed need not be emitted. Stage successes were not persisted until the entire suite ended; failure cleanup then replaced the diagnostic summary again.

## Supported conclusions and likely causes

All five reached Docker healthy before failure; fingerprint normalization remained valid after shutdown. No successful final health evidence exists. HTTP status/connectivity/timeout is a plausible explanation for a generic exception; subprocess timeout or unexpected parse/filesystem failure is also possible. Existing filtered gateway logs supplied no specific error. There is insufficient evidence to rank a most likely cause conclusively. No live check was replayed to turn a hypothesis into a claim. Local internal-network port publishing, gateway path/authentication and SQL/probe implementations remain review targets, not diagnosed failures.

## Versioned diagnostic correction

Prepared separate ignored owner-only runtime/startup-v3 directory: startup.py, diagnostics.py, handoff.json, resume-baseline.json, startup.lock.json, test_startup.py and test_diagnostics.py. Historical controllers/seals/receipts/journals/attempt markers remain unchanged.

The new verifier retains the same requirements/order/timeouts and records each stage immediately to verification-stages.json: fixed stage/category, pass/fail, elapsed milliseconds, exception class, safe numeric HTTP/subprocess code when available, and classification timeout/connection/parsing/policy_rejection/subprocess/unknown. It never serializes exception messages, URLs, command arguments, headers, response bodies, SQL result text, stack traces or raw environment. Nonzero Docker commands previously wrapped as named Failure remain policy_rejection without an underlying return code; the stage/category still locates them. No exception is converted into success.

Explicit stages: runtime_configuration, all_service_health, empty_catalog, auth_http, storage_http, ipv4_denial, ipv6_denial, internal_dns, external_dns. Stage result artifacts preserve successes preceding a failure. Existing sanitized service-state diagnostics and exact-owned shutdown remain in place. Local secret values remain only in ignored existing config/in-memory requests, never diagnostic records.

## Explicit exited-state resume policy

Startup-v3 preserves single-field OomKillDisable false/null normalization and independent daemon capability/cgroup check. It pins all historical v2 receipt/state hashes, preparation seals and exact IDs, plus startup-v2 seal and historical attempt hashes. Baseline requires all five exited with their currently recorded exit codes, exact unchanged configurations/images/network/ports/mounts/credentials and preserved volumes. REST255 is explicitly acknowledged as an expected current shutdown state; a new different exit state rejects preflight.

New gate RESUME_DIAGNOSTIC_EXACT_IDS_V3 is mandatory before any start. It creates only its own attempt marker; any later attempt is refused. It starts only existing exact IDs, in DB/Auth/REST/Storage/Kong order with health/rechecks, then staged verification. Failure stops only freshly ownership-validated task IDs, preserves every volume and records its own status. There is no recreate/remove/reset/repair path or historical state rewrite. Current DB/Auth/Storage platform data is reused; bootstrap replay is not assumed.

## Regression results

PASS: syntax validation; ten startup/security tests plus three diagnostic tests; real read-only preflight. Mocked tests cover ordered startup/failure-stop/no retry, false/null and invalid OOM values, NetworkID allocation/drift, ID/config/public-port/privilege/image/mount/environment changes, production endpoint, receipt/hash tampering and unauthorized startup. Diagnostic tests inject HTTP403, URL connection error, HTTP/socket timeout, subprocess exit2, parsing failure, policy network-probe failure and unknown exception with sentinel secrets. No sentinel appears in records; all failures remain failures. Synthetic startup/health/SQL/stop paths were mocked; no database statement or Docker mutation ran.

## Hashes

- startup.py: `e12da9a84ed5358fb2e85aea2f3415b8adb234f9aec8d3c67b2ddab998c8d549`
- diagnostics.py: `89b420367d807a411ab26e490ab16c798ce0c92e45590a67153ad6e9d58b0c70`
- handoff.json: `230c8d614a9e09b213737e7b56317fa8922e31f02208f84fa32e217a8c3c582e`
- resume-baseline.json: `adca6c0e4043c382f4c337c3cb8363e60689d900e511d42c5edb9af7ed3479ee`

Seal SHA-256: `d1de6c13099633abb924ba470c3dc7fe1b02d69e046dfe3b7f4fe989eef75dc2`.

## Risks and next authorization

The exact historical exception cannot be recovered from evidence that was never retained. Stage diagnostics improve the next authorized attempt rather than prove a historical cause. The inherited empty-catalog query covers known application table names, not a full schema/role/HBA audit. Runtime denial tests have bounded scope; full required platform-role/schema/extension/HBA/password checks still need explicit implementation or authorized manual read-only follow-up after successful gates. Do not claim Stage2A complete from Docker healthy alone.

Current containers/volumes are preserved; concurrency with unrelated Docker clients remains a TOCTOU boundary. Forced controller termination may prevent cleanup. No network/authentication/capability constraint was weakened. Any new failed attempt must stop and preserve diagnostics, never retry/reset.

Next separately authorize only startup-v3 exact-ID resume with RESUME_DIAGNOSTIC_EXACT_IDS_V3, required local official platform service startup and harmless staged local verification, plus owned shutdown on failure. No container/volume creation or replacement, SQL repair, Borealis migration/seed/user/booking or website is included. Safe future shutdown uses startup-v3 startup.py stop --confirm STOP_DIAGNOSTIC_EXACT_IDS_V3 under minimal PATH/HOME/TMPDIR, preserving volumes. Neither gate was executed here.

No production access, Git publication, deployment, Netlify or global Docker changes occurred. Stop point: diagnostics prepared; all five stopped; separate startup approval pending.
