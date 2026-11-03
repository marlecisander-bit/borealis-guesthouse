# Borealis Stage 2A startup resolution

2026-10-19 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Investigation/preparation only. No Supabase images downloaded, service containers created, services started, SQL executed, application source changed or production resources accessed. CLI remains pinned at 2.121.0.

## Decision

Recommend **B: Docker Compose with explicit create → inspect → start**, using a reduced five-service topology (the useful part of option C): Supabase Postgres, GoTrue Auth, PostgREST, Storage and a local API gateway. This solves the lifecycle inspection requirement without patching/intercepting the CLI or changing Docker globally. Prepared configuration and read-only policy checks are available; the stack is NOT execution-ready until platform bootstrap, gateway, local secrets and image identities are finalized/reviewed.

## 1. CLI root cause and official evidence

Inspected pinned official 2.121.0 source downloaded into `.local/borealis-tools/downloads/network-audit/`.

- [container-lifecycle.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/container-lifecycle.ts): createContainer creates named volumes and container, copies secret files/bootstrap archives, then calls dockerStartContainer before returning. There is a physical Docker-created state, but no supported operator pause/policy callback to inspect that state. The main [start handler](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/start/start.handler.ts) uses it for services; [start-database.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/start-database.ts) uses it for Postgres.
- Installed start --help has no create-only/dry-run/pre-start inspection flag. --ignore-health-check is not such a gate and must not be used as one.
- The explicit --network-id is resolved before SUPABASE_NETWORK_ID/generated fallback. Reviewed DB/Auth/REST/Storage/Kong and optional service builders receive that networkId. Aliases (including kong/realtime) identify services on the same selected network, not extra networks. No automatic second-network connect was found in the reviewed create/start path. This is source evidence; actual Docker attachments still require inspection.
- [docker-create-args.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts) emits --network and `-p hostPort:containerPort` without an explicit host IP. CLI's documented network-default workaround can set loopback publishing, but does not replace actual binding inspection. [Official local-development network guidance](https://supabase.com/docs/guides/local-development).
- Health probes are local: Postgres pg_isready on loopback, GoTrue /health, Storage /status, gateway health/internal readiness. [health-check.ts](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/health-check.ts) checks local gateway readiness for REST. Health itself does not require internet. Image pulls, optional integrations and startup templates are separate potential network consumers and must remain excluded/restricted.
- Interrupting CLI start is not safe as an inspection mechanism: there is no synchronization point; a signal may arrive after DB/service execution, and rollback may run. Do not race kill/stop after create, wrap Docker commands, or infer pre-start safety from fast monitoring.
- Official GitHub latest stable release metadata checked during this task still reports [v2.121.0](https://github.com/supabase/cli/releases/tag/v2.121.0), prerelease=false. No newer supported stable create-only mechanism was established. Beta/native runtime alternatives are not evidence that this constraint is solved; no upgrade performed.

## 2. Alternative comparison

| Criterion | A: Official CLI + prior Docker enforcement | B: Reviewed reduced Compose | C: Hand-built minimal stack |
| --- | --- | --- | --- |
| Production isolation | Internal network and prior Docker policy can deny egress; actual pre-execution inspection missing in ordinary CLI | Internal external network, explicit loopback ports, create/inspect gate | Can be strong but all lifecycle safeguards are custom |
| Auth/Storage/API/Postgres | Best CLI bootstrap/version integration | Supported components; official bootstrap/routing must be retained and tested | Highest risk of missing roles, schemas, grants or gateway behavior |
| Maintenance | Low normally; a daemon authorization/policy gate adds substantial complexity/global setup | Moderate; pin upstream reference and review explicit subset | High; bespoke orchestration and compatibility ownership |
| Reproducibility | Good pinned CLI; image digest resolution still needed | Good with image locks, bootstrap hashes, local secret generation and named volumes | Depends entirely on custom implementation |
| Borealis migrations | Closest platform parity; still has known application ordering conflicts | Compatible in principle with correct auth/storage roles/extensions; fresh local replay required | Hardest to establish parity |
| Network/port control | CLI uses selected network/default bindings; current local daemon has no verified pre-start authorization gate | Explicit per-port host_ip, sole network and actual stopped-state inspection | Fully configurable, less standard tooling |
| Codex operation | Simple startup command, fails current gate | Standard create/config/inspect, exact-ID start after approval | More scripts and failure modes |

A could become acceptable with a separately reviewed Docker daemon authorization policy enforcing every create/start request, but no such mechanism has been verified here; changing global daemon configuration is outside scope. B is simplest for the explicit inspection requirement. C is a scope reduction, not a reason to replace proven platform setup with bare Postgres.

Docker documents [compose create](https://docs.docker.com/reference/cli/docker/compose/create/) separately from [compose start](https://docs.docker.com/reference/cli/docker/compose/start/). Supabase documents [self-hosting via Compose](https://supabase.com/docs/guides/self-hosting/docker). The full upstream distribution is not used verbatim: it includes additional services and external-facing defaults inappropriate here.

## 3. Prepared files

All under ignored `.local/borealis-supabase/controlled-compose/`:

| File | Purpose / state |
| --- | --- |
| compose.template.json | Valid Compose draft with db/auth/rest/storage/gateway only; linux/arm64; required digest variables; pull_policy=never; restart=no; sole approved external internal network; explicit 127.0.0.1 DB/API ports |
| images.lock.example.json | Expected repositories and mandatory digest/config-ID/ARM64-verification schema; no guessed digests or image downloads |
| local-secrets.env.example | Four empty local-only secret names; no credentials generated or copied |
| bootstrap-review.json | Explicit NOT_APPROVED gate for platform schemas/roles/JWT settings; no Borealis SQL allowed |
| gateway.routes.draft.json | Local Auth/REST/Storage upstream mapping and gateway authentication/header requirements; not yet rendered secret-bearing Kong config |
| inspect_policy.py | Read-only static/resolved/created-state validator; no pull/create/start/exec mutations |
| README.md | Workflow, review gates and limitations |
| static-parse-result.json | Successful non-interpolated Compose parse evidence |

Template DB/API host ports: 127.0.0.1:54322 → db:5432 and 127.0.0.1:54321 → gateway:8000. Auth/REST/Storage are internal only. HTTP listeners may bind 0.0.0.0 INSIDE their containers; that is distinct from forbidden host wildcard publication. Only approved network borealis-local-only-isolated is declared external; Compose must not create a default network.

No host networking, privileged mode, extra_hosts, Docker socket mounts, public port bindings, restart-on-boot or external SMTP/OAuth/payments/calendar integration is configured. Auth signup/email/phone flows are disabled. Storage image transformation is disabled to omit imgproxy. Optional Studio, Realtime, functions, analytics, mail and pooler are absent. No application route is started.

Postgres and Storage use project-owned named volumes; DB mounts only future reviewed local PLATFORM init scripts read-only. Gateway mounts only a future locally rendered config. bind.create_host_path=false prevents silently making absent bootstrap/config paths. Neither runtime directory nor secret files were generated, so attempted execution cannot legitimately proceed now.

Template and images.lock repositories are candidates, not an assertion of tested cross-version compatibility. The official reference Compose text fetched at immutable supabase/supabase commit `cb5b57ce519bda1f263ff8d50b22022fceb999bf` is evidence only. Before implementation choose one reviewed official release/component set (including Kong compatibility), record source hashes and complete the bootstrap/gateway transformation manifest; do not mix current upstream Envoy defaults with CLI Kong templates without review.

## 4. Inspection policy and validation

Read-only commands run:

```bash
python3 .local/borealis-supabase/controlled-compose/inspect_policy.py --template
python3 .local/borealis-supabase/controlled-compose/inspect_policy.py --self-test
```

Both PASS. Seven synthetic unsafe variants were rejected: host network, public binding, extra network, external proxy, production URL, privileged mode and automatic restart. No Docker operations in these synthetic tests.

Docker Compose v5.6.0 successfully parsed the template with --no-interpolate, --env-file /dev/null and explicit local project directory under an allowlisted environment. This is syntax validation, not a functional or credential compatibility test. An invocation without required rendered config fails closed. No creates/starts/pulls occurred.

Future --rendered FILE rejects unresolved interpolation, unpinned/wrong repositories, nonlocal endpoints, production-reference/host indicators and unapproved service modes. It requires reviewed bootstrap hashes, real image lock, local-secret provenance hashes and rendered gateway file; it prints only reason names, never raw env/secret values. This provides rejection plus local-generation provenance, not mathematical proof that an arbitrary opaque password was never used elsewhere. Production files are never read to compare secrets.

Future --created additionally reads Docker inspect/image inspect/volume inspect only, requiring:

- Exactly five expected Compose service identities, each still in created state and never running.
- Exact approved network ID `e1a8111682ffdc13c667d86f514dbd09265802dc73ba016dec63a6fc50bcabb1`, Internal=true, IPv6 disabled and loopback default; no secondary network or unexpected peer.
- Exact per-service loopback HostConfig port bindings, no public wildcard; no host namespaces, privileges, added capabilities, devices, alternate DNS or host mapping overrides.
- Expected immutable image config IDs and local linux/arm64 image metadata.
- Matching reviewed environment; no production reference or nonlocal endpoints. No env dumps.
- Only approved runtime read-only bind paths; named volumes must have expected project/name labels and destinations. No source/project/production dotenv mounts.

Created-state validation has not been executed against service containers because none exist. Guard behavior is verified on the prepared template/synthetic inputs; real image defaults, users, mounts, writable paths and capabilities remain to be checked. Some images may require narrowly justified local capability/filesystem adjustments; any adjustment requires review and must preserve network controls.

## 5. Future security verification procedure — not executed

1. Under separate approval, generate fresh local-only DB/JWT/anon/service credentials privately. Save owner-readable ignored files/provenance; never print status/config output containing secrets. Do not inherit production .env.local. Use minimal subprocess env and explicit local secret file/project directory; prevent Compose's default dotenv lookup.
2. Resolve one reviewed upstream service set and official platform bootstrap/routing; record hashes. Resolve/pull only approved ARM64 images by digest after image-download authorization. Service-local Auth/Storage platform schema initialization is required; it is separate from prohibited Borealis SQL.
3. Rerun static/rendered policy plus network identity/isolation probes. Allow only required internal DNS/DB/HTTP paths. Preserve the network's no-default-external-route behavior; no fallback proxy or external DNS.
4. With creation authorization, run explicit Compose create --pull never --no-build. Do not use compose up/run, which can combine creation and execution. Keep restart=no.
5. Inspect ALL created containers and volume/image identity against the resolved hash-locked configuration; retain evidence without secrets. Re-inspect before starting each exact container ID. Abort if IDs/spec/network changed; do not invoke a recreate-capable command after inspection. Docker daemon access by unrelated processes remains a trust assumption/TOCTOU risk; prevent concurrent modifications.
6. Start only approved inspected IDs in dependency order: DB → Auth/REST → Storage → gateway, waiting for local health between steps. The exact lifecycle controller is not implemented by this preparation; raw docker start does not implement Compose dependency waits. Capture logs privately; do not display credentials.
7. Recheck attachments, bindings, egress, local API/Auth/Storage/Postgres health and empty application catalog/users. Existing platform schemas/roles are expected; no Borealis tables/data/users/bookings. On failure stop only task-created exact IDs, preserve diagnostic artifacts and volumes; no prune/reset/deletion.

## 6. Remaining risks and compatibility gates

- Bootstrap/gateway templates, local credential generator/provenance verification, concrete image lock and lifecycle controller need completion/review. Current drafts intentionally cannot pass execution-readiness checks. No change to the installed CLI solves this automatically.
- Supabase Postgres images/roles/storage policies differ from a bare Postgres database. Platform Auth/Storage may apply their own initialization migrations; no claim of zero platform SQL is made. No Borealis SQL is included.
- Current application SQL includes conflicting version prefixes, legacy-helper/RLS decisions and production-specific seed exclusions. Compose does not resolve them; original files/manifests are preserved for Stage 2B.
- Realtime publication migration/notification UI parity may require a later optional Realtime service. Five-service topology targets only the authorized empty DB/API/Auth/Storage environment.
- Internal bridge probe PASS has bounded scope, including local connected gateway limits. Actual service environment/defaults and all host-published bindings still need verification; host/container/browser isolation are separate scopes.
- Image ARM64 support, filesystem writes and unprivileged users are unverified until authorized image inspection. Never add privileged mode or a public bridge to satisfy startup/health.
- Existing production .env.local remains preserved; Borealis website must stay off. Google Fonts and the separate app launcher are unrelated blockers outside this task.

## 7. Exact next authorization

Approve a **Compose preparation completion step**, without service execution: choose/pin the official upstream component release; resolve/download only the five necessary official ARM64 images; complete reviewed platform-only bootstrap and authenticated local gateway config; generate fresh local secrets privately; finish an exact-ID create/inspect/start controller. These are prerequisites, not operations performed in this investigation.

Then separately authorize creating the stopped local containers/volumes for inspection, followed by starting only successfully inspected IDs and running harmless local health/catalog/network checks. Keep all Borealis SQL, seeds, test users, bookings, website and production access excluded. No CLI upgrade or global Docker modification is needed for the recommended approach.

Status: root cause established, alternatives compared, standard Compose lifecycle selected and concrete fail-closed preparation/inspection artifacts delivered. No service execution authorized or performed.
