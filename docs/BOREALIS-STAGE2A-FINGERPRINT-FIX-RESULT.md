# Borealis Stage 2A fingerprint fix result

2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Controller preparation PASS; no restart performed.** All five exact IDs remain stopped. PostgreSQL remains exited0 after prior controlled shutdown; Auth/REST/Storage/Kong remain created and never started. All original and recovery volumes remain present. No configuration, receipt, image, database or Docker resource was altered.

## Root cause and exact normalization

Reconfirmed that replacing only current DB HostConfig.OomKillDisable=null with false reconstructs its historical receipt fingerprint exactly. All other fingerprint inputs remain identical, including ID/image, Config/environment/labels, other HostConfig settings and mounts. Historical receipts remain preserved.

Only a present OomKillDisable field whose value is exactly JSON false or null is canonicalized to false. True, integers 0/1, strings, lists, objects and a missing field are rejected. All other snapshot values/field sets retain byte-value comparison through the existing complete JSON snapshot. Unknown fields produce a different hash and are rejected. No generic null/empty normalization was introduced.

## Independent effective-semantics verification

Installed Engine29.8.2 reports GitCommit8af9fe3. Read-only docker info reports OomKillDisable=false (kernel capability unsupported), CgroupVersion=2.

The matching official [Moby daemon source](https://github.com/moby/moby/blob/8af9fe3/daemon/daemon_unix.go) establishes both stages: adaptContainerSettings defaults nil OomKillDisable to false; verifyPlatformContainerResources clears the pointer to nil when sysInfo.OomKillDisable is false. getMemoryResources passes a non-nil value into the OCI DisableOOMKiller field. Thus the observed false→null reflects unsupported optional OOM disabling, not a request to disable the killer. The controller independently rechecks this daemon capability/cgroup condition at every preparation validation and refuses if it changes. It continues rejecting true even if the daemon would discard it.

No live runtime experiment was needed. This verification does not relax memory limits or any network/security control.

## Versioned implementation and provenance

Separate ignored owner-only directory runtime/startup-v2 contains startup.py, handoff.json, validation-record.json, startup.lock.json and test_startup.py. Existing startup-v1, original/v1/v2 seals, state and historical receipts remain unchanged.

The new controller binds historical v2 receipt/state byte hashes, all original/transitive preparation seals and exact IDs. It normalizes the one field in pre-start, between-start and delegated local runtime checks. It preserves exact image/ID/network names, actual running NetworkID, ports, mount metadata, environment/credentials, ownership, capabilities and restart checks, plus gateway/hash validation. Running endpoint allocation remains separately validated and egress checks are retained. There is no create/recreate/remove/reset path.

Current initialized-but-stopped DB is explicitly admitted only as exited with exit0, while all four peers must still be created and never started. DB image configuration/mounts and existing volumes must still match; volumes are not replaced. A new per-revision attempt marker forbids automatic retry. Each dependency start remains exact-ID and followed by health/re-inspection; failures stop only ownership-checked task IDs and preserve every volume.

This revision has its own code seal and validation record; it does not overwrite an old receipt or pretend DB is never-started. The pinned historical receipt is configuration evidence validated under the explicitly versioned canonicalization rule. Separate explicit resume confirmation is mandatory.

## Tests

PASS: Python syntax validation; ten unittest methods; real read-only resume preflight. Tests include false/null equivalence, true/unexpected-value rejection, actual running NetworkID allocation and wrong-ID rejection, extra/host-network drift, public-port rejection, image/privilege/mount/environment drift, receipt tampering, no-confirm startup, ordered synthetic starts, simulated failed health with owned stop/no retry, and second-attempt rejection. Docker start/stop, health, verify and state writes in synthetic execution were mocked. Synthetic success output is not a live platform-health PASS.

Read-only current-state verification confirms the root-cause assertions; no unexplained configuration drift remains in snapshot inputs. No SQL, runtime egress probe, service start/stop or infrastructure mutation was used for testing.

## Hashes

- startup.py: `f3f29cbdc2d22d33f3bfaf5c2abd2905688f365b3a667c598fef75f6cb67d9bd`
- handoff.json: `230c8d614a9e09b213737e7b56317fa8922e31f02208f84fa32e217a8c3c582e`
- validation-record.json: `9fb9c10237d74761a8b2995bdf51e4c539a44848011d1914b2d54b4943adcba9`

Seal SHA-256: `a1748f864e10ce1a91b7d25dd294ff1cbb0930836332ff172e15e67a9822d031`.

## Initialized-volume restart readiness and risks

Existing logs show platform initialization completion; the entrypoint normally skips bootstrap when PG_VERSION exists. Do not assume scripts rerun. The volume marker/catalog was not queried or mounted here. Reusing the existing recovery volumes is preferable to reset/recreation, subject to separately authorized restart and live read-only validation. No full bootstrap-health claim is made from logs alone.

The last unhealthy Docker health state remains a separate runtime concern. A restart may fail its health gate; the controller must stop and preserve diagnostics rather than loosen checks. Effective HBA/client authentication, required roles/schemas/extensions, zero auth users/application tables, complete service health and container egress must still be verified. The inherited runtime check suite has its documented limited scope; further platform assertions may be needed before claiming every item verified.

Strict comparisons may still reject another as-yet-unobserved runtime-dependent representation change in a peer container. That must be investigated independently; this revision normalizes nothing else. Docker daemon concurrent access remains a TOCTOU boundary; seals detect accidental drift, not a malicious administrator rewriting code and seals. A forced process kill cannot guarantee cleanup.

## Exact separate authorization

Authorize only startup-v2 resume of the five pinned IDs, using RESUME_INITIALIZED_DB_EXACT_IDS_V2, required local platform service initialization where necessary, harmless local health/catalog/authentication/network checks, and owned-ID shutdown on failure. No new container/volume, SQL repair/reset, Borealis migration/seed, booking/user or website is included. This task did not invoke that gate.

Future safe owned shutdown uses startup-v2 startup.py stop --confirm STOP_RECOVERY_V2_EXACT_IDS_V2 from the canonical clone with minimal PATH/HOME/TMPDIR environment; it preserves all volumes. No shutdown was necessary or run here.

No production requests/credentials, application source changes, Git publication, deployment, Netlify or global Docker changes occurred. Stop point: new controller prepared, all services stopped, restart pending separate authorization.
