# Borealis final Supabase local solution assessment

2026-10-20 (Europe/Tirane). Analysis only. Canonical workspace: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**No verified supported local correction is available within the current project-scoped constraints. Recommend a separate hosted development project as the next practical option, subject to explicit approval. Keep both local stacks stopped and preserved.** No upgrade, service operation, Docker configuration change, SQL or production access occurred.

## Evidence and release comparison

Reviewed the Docker loopback diagnostic, previous binding resolution and development architecture decision. The disposable experiment established that omitted HostIp produces effective wildcard IPv4/IPv6, while explicit 127.0.0.1 produces loopback-only publication; both localhost HTTP tests passed. This isolates a default-publication-path problem on the tested runtime, rather than a Kong-specific connectivity problem. It does not identify the exact faulty Engine/Desktop component.

Live official GitHub release metadata was checked for this assessment. Search-index results were older, so the official releases API was used to determine the stable version.

| Release | Status at assessment | Relevant finding | Decision |
| --- | --- | --- | --- |
| 2.121.0, published 2026-10-14 | Latest stable; already installed | Tagged Docker publication builder emits hostPort:containerPort without a host address; no verified supported bind-address option | An upgrade to latest stable would change nothing |
| 2.122.0-beta.5 | Prerelease | Reviewed tagged publication helper still emits the same omitted-address form | No demonstrated loopback fix; do not install |
| 3.0.0-next.21 | Prerelease | Reviewed helper also unchanged; next-major compatibility changes require independent review | Not a supported stable replacement or verified fix |

Sources: [latest stable API](https://api.github.com/repos/supabase/cli/releases/latest), [release list API](https://api.github.com/repos/supabase/cli/releases?per_page=8), [2.121.0 release](https://github.com/supabase/cli/releases/tag/v2.121.0), and tagged publication code for [2.121.0](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts), [2.122.0-beta.5](https://github.com/supabase/cli/blob/v2.122.0-beta.5/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts) and [3.0.0-next.21](https://github.com/supabase/cli/blob/v3.0.0-next.21/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts).

The stable release provides a Darwin ARM64 archive, so Apple Silicon installation is supported. Architecture availability does not repair publication semantics. No newer stable configuration or migration changes need applying because no newer stable candidate was found. A future upgrade must review config deprecations, platform image/database compatibility and lifecycle changes before touching initialized volumes. Existing Borealis migration reconstruction remains a separate unresolved task; a CLI upgrade does not repair it.

The reviewed CLI help/configuration and publication path establish no supported per-service host-IP option. A string-typed internal hostPort member is not a public configuration contract. Do not prepend an address to numeric TOML ports, invent environment variables or infer a supported flag from an internal helper. [CLI configuration reference](https://supabase.com/docs/guides/local-development/cli/config).

## Docker compatibility findings

The supported Engine mechanism is explicit publication to 127.0.0.1; it passed the disposable test. For omitted addresses, Docker documents a user-defined bridge option, com.docker.network.bridge.host_binding_ipv4=127.0.0.1. Supabase documents that same network with start --network-id. This is precisely the project-scoped method already attempted, and the probe demonstrates that it does not enforce the required outcome on this installation. Repeating it is not a correction. [Docker publication defaults](https://docs.docker.com/engine/network/port-publishing/), [Supabase local network guidance](https://supabase.com/docs/guides/local-development).

Docker Desktop forwards published traffic through its host backend into the Linux VM. Its documentation also mentions changing the default to localhost through Desktop network settings. That is a Desktop-wide default, not a demonstrated per-project override; the reviewed settings reference establishes no separate project selector for this purpose. It is outside the present no-global-change scope and was neither inspected as an active fix nor changed. A UI/default setting must not be represented as a verified correction for these existing containers. [Desktop networking](https://docs.docker.com/desktop/features/networking/), [Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/).

Disabling IPv6 alone would leave wildcard IPv4. Host networking weakens the intended boundary. A firewall can restrict reachability but does not produce explicit loopback mappings. Daemon-wide defaults, runtime replacement and Desktop upgrades affect more than this project and require separate review and empirical validation. No version-specific upstream fix was established here. The exact Engine 29.8.2/Desktop default-path defect remains unresolved.

## Selected path and alternatives

| Priority | Supported candidate | Assessment |
| --- | --- | --- |
| A | Stable CLI upgrade with verified loopback support | None found; installed version is latest stable |
| B | Project-scoped Docker default-binding network | Officially documented, empirically ineffective here; no second verified project-scoped control found |
| C | New hosted development project | Recommended practical fallback; removes the local Docker publication blocker and supports isolated database/application testing |

No CLI patch, command interception, Docker API rewriting, wildcard acceptance, custom relay or speculative runtime switch is recommended. Experimental native stack commands mentioned in current Supabase documentation are a different lifecycle/runtime and have not been validated against these requirements; they are not a proven drop-in solution.

## Preservation and installation implications

No installation or local configuration change is selected now. Preserve all nine stopped official containers, their recorded identities, and both official volumes:

- supabase_db_borealis-cli-dev-20261020
- supabase_storage_borealis-cli-dev-20261020

Preserve the standard bridge borealis-cli-dev-20261020, ID c4de25bcf8e3e36f0b4cc063f972c419718f37ea784a24cc720fc011ab8f5f15, cached images, private logs, attempt markers and diagnostic receipts. Preserve the five historical custom containers, all five custom volumes and their internal network. No reset, migration, automatic adoption or cleanup is needed for a hosted development path. This assessment relies on the recorded preservation evidence and performs no new Docker mutation.

A later local fix needs a fresh disposable test proving effective loopback mappings and host connectivity on the exact proposed runtime/configuration. Existing stopped resources must not be assumed safe simply because a default changed. Review whether recreation is required; obtain exact-container approval while retaining named volumes and compatibility evidence. Never reset or silently remove old resources.

## Hosted development plan

Create a brand-new project with its own reference, credentials and synthetic data only, preferably under a dev-only identity with no production privileges. Owner selects organization, region and budget first. Free eligibility and quotas must be checked at creation; do not assume an available slot or alter production organization/billing. Consult [current pricing](https://supabase.com/pricing) before approval; no account or billing state was accessed here.

Prepare a separate production-free app/runtime environment that accepts only the exact new development reference. Exclude production dotenv, cloud/deployment tokens and build artifacts. Keep real SMTP, payment and calendar integrations disabled; approve any test messaging separately. Hosted development requires internet access to its own project and is not offline or air-gapped. Endpoint guards and separate credentials reduce mistakes; technically preventing production traffic additionally requires an enforced network/identity boundary. Developer discipline alone is not a guarantee.

Before any application SQL, derive and review a uniquely versioned migration history, resolve dependency/helper/RLS ordering and exclude production-specific 034/035 data. Do not pull production schema or history. Separately authorize applying that reviewed history only to the new development project, followed by fictional fixtures and booking/availability/pricing/CMS tests. Hosted development does not eliminate the existing SQL compatibility blocker.

## Exact next authorization

Approve preparation of the hosted-development setup with the chosen organization, region, dev-only identity and maximum spend. Then explicitly authorize creation of one new development project and storage of its credentials in an owner-only ignored environment. Neither approval includes production access, SQL replay, synthetic records, website startup or deployment.

After project identity/environment review, separately authorize the reviewed dev-targeted migrations, fictional fixtures and local website tests in that order. Git publication, Netlify and production deployment remain independent approvals. If local operation remains mandatory, authorize only a new bounded runtime/default-setting investigation and disposable validation; no further Supabase startup is justified until a supported correction passes.

**Outcome: local startup remains blocked; hosted development is the recommended next path under the current constraints.** No services, containers, networks, volumes, SQL, application source, production systems or deployment settings were changed by this assessment.
