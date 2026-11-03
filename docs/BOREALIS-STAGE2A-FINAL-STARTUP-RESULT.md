# Borealis Stage 2A final startup result

Verified 2026-10-19 (Europe/Tirane), canonical clone `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Overall FAIL: PostgreSQL platform initialization exited with code 3. Startup halted safely; zero running containers.** Only the inspected DB ID was started. Auth, REST, Storage and Kong remain created and never started. No corrective changes, retries, recreation, deletion or reset occurred. All three local volumes are preserved, including partially initialized DB state.

## Pre-start verification

PASS: sealed preparation and inspection receipt, exact five IDs and never-started states, cached image/configuration fingerprints, gateway hash/ownership, approved internal network identity and no unexpected peers. Local project remains borealis-local-only, no hosted-link marker, disabled migration/seed execution, empty active migrations directory. Ports 127.0.0.1:54321 and :54322 were free. Controller ran with allowlisted PATH/HOME/TMPDIR only; production dotenv and cloud credentials were not loaded.

An initial supplementary read-only Python check could not import tomllib on the installed Python; the check was rerun successfully without that dependency before startup. No sealed controller or configuration was changed.

## Containers and service health

| Service | Exact container ID | Final state | Exit code |
| --- | --- | --- | --- |
| db | `4bdc30b2124a60bf0f55dac00f295a5f0a51345456e1f4541e77e2ac047cc694` | exited | 3 |
| auth | `8ab9c783fa1bd919223176bb179841ac6acb8b7edfdb58f57f6c237356981b91` | created | 0 |
| rest | `8949d74edb50e2d152d7fe16b6c7e78936a16c763d90dcb81d98bd8f842036d6` | created | 0 |
| storage | `d0561e270eb1a0a78fa9a60b8dd38adcd67abd9834d3a918e9235d4b3abcb54b` | created | 0 |
| gateway | `4c2bc800f2edd1f565d6b45795712a5b51a0c31dd7686265fa70a4cc26fd9494` | created | 0 |

PostgreSQL never passed the controller health gate. Other service health, platform API, REST, Auth, Storage and Kong readiness checks were not reached. Container IDs and immutable image set are unchanged from the stopped-container report and images.lock.json.

## Exact failure and platform state

The official image's platform initialization ran, including JWT database configuration and part of the roles script. It failed at:

```text
psql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:7: ERROR: role "supabase_functions_admin" does not exist
```

The prepared roles.sql assumes a role supplied by upstream initialization that the reduced stack omitted. This is a platform bootstrap dependency failure, not evidence of a network/permission problem. The upstream optional webhook/functions bootstrap omission must be reviewed against the roles script. Do not silently remove the failing statement or create a guessed role.

The initialization log also reports local trust authentication enabled by initdb. Review intended local socket authentication as part of the corrective bootstrap review; this message does not establish host authentication policy.

No read-only catalog/user queries ran because DB readiness failed. Therefore platform schema completeness, zero auth users and absence of Borealis tables are **not runtime-verified**. No Borealis SQL, seed, user creation or booking operation was invoked or mounted. Partial platform initialization remains on the preserved volume.

## Network and ports

Approved network identity revalidated: `e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1`, internal bridge borealis-local-only-isolated, IPv6 disabled. Configuration remained sealed with only this network requested; no additional network or host mode was introduced.

HostConfig requests remain DB 127.0.0.1:54322 → 5432/tcp and gateway 127.0.0.1:54321 → 8000/tcp; Auth/REST/Storage have no published ports. No wildcard host publication was configured. No services remain running. Runtime local API/Postgres reachability and service-container IPv4/IPv6/DNS denial checks were **not reached**; prior probe PASS is not substituted for this missing runtime evidence. Production was never used as a probe target or contacted.

## Failure handling and evidence

The existing controller invoked its owned-container stop handler and recorded lifecycle phase stopped. All five exact IDs were re-inspected afterward and Running=false confirmed. No volumes were deleted. Evidence:

- runtime/diagnostic-summary.json: sanitized controller failure summary.
- runtime/final-startup-evidence.json: IDs, final states, timestamps, network metadata and requested port bindings, mode600.
- Existing preparation seal and stopped-container receipt remain preserved. Their prior PASS does not authorize a retry; lifecycle phase is stopped and startup prerequisites must be reviewed anew.

No raw environment, service secrets or unredacted credential-bearing logs are included.

## Recommended correction and separate authorization

Authorize investigation/preparation of the missing platform-role dependency using the same pinned upstream release, including review of the omitted upstream bootstrap scripts and the trust-auth warning. Prepare the smallest platform-only correction with explicit provenance and an updated seal; preserve Borealis application/database files. Do not alter networking, capabilities or image versions to bypass this SQL failure.

The DB volume is partially initialized; a plain restart cannot be assumed to replay initialization correctly. Any repair SQL, replacement configuration, container recreation or new disposable-volume initialization requires separate explicit authorization. No reset/deletion is requested or performed here. Review and re-inspect the corrected stopped configuration before separately authorizing another startup attempt.

## Safe shutdown and Stage 2B

All containers are already stopped. If shutdown is needed after a separately approved future run, use only:

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" python3 .local/borealis-supabase/controlled-compose/lifecycle.py stop --confirm STOP_TASK_OWNED_LOCAL_ONLY
```

This targets ledger-recorded task-owned IDs and preserves volumes; do not use prune/reset/blanket deletion.

Stage 2B remains blocked until corrected platform bootstrap is reviewed, separately authorized startup passes health/catalog/network checks, and application migration ordering/helper-policy conflicts are resolved. Application migration/seed execution requires separate approval. Website, fonts and app launcher remain outside Stage 2A.

No production requests or credentials use, application startup/source edits, Git commit/push/merge/deployment, Netlify changes or global Docker changes occurred.
