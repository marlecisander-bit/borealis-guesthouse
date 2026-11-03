# Borealis Guesthouse — project setup complete

21 October 2026, Europe/Tirane. **DEVELOPMENT SETUP COMPLETE.**

**Borealis Guesthouse is ready for further local development. No additional environment setup is required.** Setup is closed. Normal scoped local website/admin work can begin immediately; unfinished security deployment, live booking acceptance and integrations are separate backlog work rather than general setup prerequisites.

## Existing environment and tooling

Canonical editable source: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Use this folder explicitly, rather than the older Projects Dev clone or a `.local` preview/build snapshot. The canonical folder was opened in VS Code during baseline verification; previous windows/work were preserved. Current local Git branch **main**, HEAD **745b4aa56589cda5e5d0c8823ccc1cabb055e313**; staging is empty. This is a preserved working tree with prior changes, not a clean production release set.

| Resource | Existing identity |
| --- | --- |
| Supabase | `rlqyruulxyanfgvnzkpe`, borealis-guesthouse; organization `kywcwpvblqjgfhetefxx`, Free, eu-west-1; last read-only server check PostgreSQL17.6 |
| GitHub | `marlecisander-bit/borealis-guesthouse`; last remote main inspection matched local HEAD |
| Netlify | `https://borealisguesthouse.netlify.app`; last read-only dashboard confirmed the same published SHA, deploy `6aa69097a30b800008847240`; auto-publish from main ON |
| Runtime | Pinned **Node20.19.5 / npm10.8.2**; Next16.3.4, React19.2.8; existing lockfile/dependencies |
| Fonts | Existing local OFL Manrope/Cormorant Garamond assets/provenance/licenses preserved; no Google Fonts build download |

No new platform connection, resource, environment, Docker stack, package install, credential or hosting configuration was needed in this task. Supabase public URL matches the exact existing project, and the public key slot has publishable-key format rather than secret-key format. Values were not printed or copied to the report. This was a local configuration check, not a fresh live key-acceptance probe.

`/.local/` and `.env*` ignore checks PASS. No private file is staged. The build runs with a sterile environment and only explicitly public Supabase build configuration; no privileged/provider credentials are supplied. Existing environment files were not changed. Publication hygiene is scoped to the current/inventoried files and intended future release set, not a claim that all Git history has been secret-scanned.

Node20 is the verified reproducibility target; it is outside lifecycle support at this date and the installed SDK emits a deprecation warning. Runtime modernization remains a scoped maintenance task, not a requirement to create new infrastructure or silently upgrade dependencies before ordinary local changes.

## F03 local proposal completed

[Revised complete F03 proposal](security-proposals/phase-a/hero-metadata-v2/F03-media-and-hero-policy-consolidation-v2.sql.proposed), SHA-256 **`9214519c97484958c7b632aad6e333a18b98ad3cd02ec9a09496bf2861c92f1e`**. Its [scope notes](security-proposals/phase-a/hero-metadata-v2/README.md) and [manifest](security-proposals/phase-a/hero-metadata-v2/manifest.json) identify it as an **alternative complete transaction** for future review; do not apply the original and then this copy. It remains `.sql.proposed`, outside active migrations, unexecuted and not production-approved.

The revision preserves the original Storage/media policy statements and replaces only hero admin read/insert/update branches with explicit active property-scoped O/M/E authorization through the recorded trusted can_manage_property helper. Staff, disabled/nonmembers and unauthorized cross-property targets are excluded by that contract. Ready-state public reads remain unchanged. UPDATE checks the source property's authorization and the complete target's authorization/path integrity; authorized editors may inspect/repair legacy rows. No DELETE policy, lifecycle state, processing algorithm, shared can_manage_homepage function, account/membership, existing object or bucket setting is changed.

The new pure IMMUTABLE SECURITY INVOKER helper validates original id/kind/property paths and optimized variant id/property/attempt/width paths and JSON shape. Pending/processing can have no variants; ready writes require at least one. Helper ownership is explicitly postgres with empty search_path and authenticated-only execution. The existing definer membership helper's postgres owner/configuration and recorded server fingerprint are guarded; schema CREATE, role inheritance, policy baseline, bucket settings, F02 denial and unexpected helper grants are checked. No unpublished hero path is exposed by the pure helper.

Existing 24 MiB database metadata constraints are preserved to avoid narrowing historical data silently; prepared application uploads/variants and the bucket remain capped at **10 MiB**. Actual object existence/bytes and correctness of metadata are not proven by a path policy. Legacy row/variant compatibility still needs bounded preflight before future execution; no backfill/repair was run.

Original F03 proposal remains byte-identical, SHA-256 **`c37193538e29df1f67a0a1fecbeba87209b40584f7b4bc08cef1c3f07febf217`**. Original F01 proposals/hashes and all previous evidence remain intact. New `tests/hero-metadata-policy-proposal.test.ts` adds six static/mock cases: original preservation/transaction scope, policy/ownership constraints, active roles versus disabled/staff/nonmembers, source-and-target property checks, lifecycle/public-read continuity, and malformed/cross-property original/variant rejection. These are explicit models and text assertions, **not PostgreSQL parsing, RLS or permission execution**.

The revised proposal uses the newer recorded server membership-helper fingerprint and preserves the older evidence. It does not silently repair the separate F01 exact-fingerprint discrepancies. Final executable SQL still needs independently reviewed fresh schema/ACL/default privilege/owner assertions, real parser/runtime acceptance and operation-specific approval. Those are release controls, not an unfinished local setup cycle.

## Validation

All checks used the existing network/credential safeguards; no application server or unrestricted browser test was started.

| Check | Result |
| --- | --- |
| Full unit suite | **168/168 PASS**, zero failed/skipped |
| Focused F01/F03/static hero-policy/real synthetic image processing | **51/51 PASS** |
| TypeScript noEmit | **PASS** |
| ESLint | **PASS** |
| npm dependency consistency | **PASS**, npm ls --all exit0; no install/update |
| Clean production-style Next Webpack build | **PASS**, pinned Node20.19.5, OS deny network* |
| Artifact integrity | **503 hashes independently rechecked**, zero mismatch |
| Dependency clone/integrity | **22,428 file/link entries** identical before/after |
| Runtime application source | Unchanged in this task; F01/F03 patches remain separately identifiable |
| SQL parser / live RLS / live upload / actual deployment | **NOT TESTED / NOT EXECUTED** |

Private evidence: `.local/project-setup-closure-v1/` and `.local/safe-checks-20261021T124236947039Z/`. Build finished **12:43:56 UTC**. Artifact-manifest SHA-256 **`8abd37801ffeef03319735536a66e091be308b20f5619e5ea98161ede07e3806`**. Only compiler-generated files in the private snapshot may differ; canonical app source and dependencies are preserved. No preview flags or privileged credentials were supplied. Canonical pre-existing preview safeguards are not automatically a production release set; future source-only publication must exclude unrelated preview changes.

## Preparation closed; production backlog remains

| Item | Local/setup state | Separate production state |
| --- | --- | --- |
| F01 draft confidentiality | Preparation COMPLETE; reviewed application candidate/tests and SQL proposals retained | Implementation PENDING; exact-fingerprint reconciliation, expansion, authorized role tests, compatible release, authoring drain and contraction/verification remain |
| F02 internal booking helpers | Narrow privilege fix IMPLEMENTED and independently verified; most recent read-only check still denies ordinary callers | Full booking/retry/concurrency/notification acceptance remains unverified |
| F03 Storage authorization | Application compatibility PASS; hero-metadata revision and static/mock tests COMPLETE for local review | Policy/service tests, final guards, signed-token drain and coordinated deployment PENDING |

No SQL or application deployment ran. The local F03 revision resolves the prior missing hero-policy design scope; it does not change the deployed legacy helper/policies. The new app does not request signed upload tokens, but direct signing must be denied at the Storage service boundary during future cutover. Verify the deployed maximum lifetime rather than assuming the documented two hours; conservatively bound last issuance and in-flight operations, keep authoring paused through capability drain, then verify actual role/path/public-read/cleanup behavior. Never restore broad legacy permissions automatically to recover authoring.

The encrypted database/role and 71-object public-media package retains prior verified integrity. Last local authentication passed for76 encrypted files and88,411,326 media bytes. No actual restore, off-Mac retention, independent key recovery or complete platform configuration recovery is proven. Three pending hero originals were historically absent. Preserve the backups and Keychain; no backup/evidence was deleted or copied externally here. Recovery limitations require explicit release decisions; they do not prevent offline frontend/admin development.

## Simple commands and normal workflow

From the canonical repository:

```sh
cd /Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse
git status --short
python3 scripts/borealis-safe-checks.py
```

The existing safe-check command runs the TypeScript loader/unit suite, type check, ESLint and production-style build under OS-denied networking in a private source/dependency snapshot. Logs/result.json stay under `.local/safe-checks-*`. It does not install packages, start a server, run SQL, create fixtures or publish. Avoid substituting plain Node20 --test on TypeScript or loading the entire dotenv into a test environment. For small tasks, use the same runner's documented loader/network safeguards for focused tests; run the full command when type/lint/build are affected. Reuse expensive passing artifacts only after checking source/dependency identity.

Normal task sequence:

1. Understand the requested result and inspect only relevant canonical components plus existing findings.
2. Read relevant installed Next.js guidance before framework changes; make the smallest authorized local edit and preserve unrelated work.
3. Run focused offline tests and appropriate type/lint/build checks.
4. Verify affected public/admin reader/editor/API contracts with synthetic fixtures or mocks; label any live behavior untested.
5. Explain changes and evidence plainly, and identify any SQL/provider/configuration dependency separately.
6. Stop before Git publication, deployment or live mutation unless separately authorized for that specific operation.

No new general audit, infrastructure plan or F01/F03 deployment is required for an unrelated local feature. Public components, styling, navigation, mobile/accessibility, admin form validation, translation mappings, metadata/SEO logic, media UI, and booking/integration code against fake adapters can be developed immediately. Do not enable uninstalled private F01 RPC paths against the existing database, run a write-capable server against production casually, send real notifications, or mutate real booking/Auth/Storage/CMS data as an incidental test.

The owner can now request the next ordinary feature directly. Deployment/security gates are tracked in [the development priorities and security backlog](BOREALIS-NEXT-DEVELOPMENT-PRIORITIES.md), not as another setup prerequisite.
