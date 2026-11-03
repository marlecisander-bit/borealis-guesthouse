# Borealis next development priorities and security backlog

21 October 2026. **DEVELOPMENT SETUP COMPLETE.** Borealis Guesthouse is ready for further local development. No additional environment setup is required. Use the existing canonical repository and platform; routine feature work does not require another general audit or production F01/F03 deployment.

## Ordinary local feature development — ready now

| Area | Useful local work | Test boundary |
| --- | --- | --- |
| Public/admin CMS connectivity | Translation editor-to-reader field contracts (F05), explicit gallery membership UI (F06), published-media reference coverage (F07), bounded admin save/error handling (F04) | Synthetic content and mocked repositories; SQL-backed transactions/publication remain separate |
| Booking reliability and currencies | F27 ALL currency consistency, F12 retry/idempotency, F13 abuse/work-budget logic and capacity inputs | Offline quotes/fixtures/mock transport; no actual booking/hold/confirmation writes |
| Email/calendar integration code | F08–F11 sender/outbox/feed validation, retries, scheduler authentication and SSRF boundaries | Fake providers/feeds only; no real sends, sync, payment or webhook effects |
| SEO, accessibility and mobile | Origin-derived metadata using the existing Netlify URL, gallery focus lifecycle (F21), preview destination validation (F22), keyboard/mobile components | Fixture/framework tests and separately scoped safe browser review |
| Runtime and maintenance | F23 supported Node target and portable TS runner; measured scale tests and authoritative-model cleanup | Separate scoped dependency/runtime task; preserve current reproducibility until reviewed replacement passes |

The next task may be any requested local website/admin improvement. Inspect relevant components only, implement the minimal patch, test affected public/admin connections and explain results. Do not start a new infrastructure preparation cycle.

## Security remediation and deployment backlog — separately approved

| Priority | Remaining production work | Current local state |
| --- | --- | --- |
| 1 — F01 draft confidentiality | Reconcile exact helper fingerprints; fresh preconditions/recovery decision; approved key/RPC expansion; identified synthetic role tests; clean compatible app release; authoring drain; separately approved contraction and public/private/cache checks | Preparation COMPLETE; no F01 SQL or deployment executed |
| 2 — F03 Storage authorization | Review final v2 hero+Storage policy candidate and exact guards; real Storage operation/role/path tests; deployed signed-token lifetime and in-flight bounds; maintenance/source-only release/policy cutover; token drain and public/cleanup verification | Authenticated upload compatibility PASS; versioned hero-metadata proposal and static/mock tests COMPLETE |
| F02 acceptance follow-up | Preserve implemented reference/expiration helper restrictions; complete approved nested booking/concurrency/notification acceptance | ACL correction IMPLEMENTED and historically/freshly read-only verified; full business workflow unverified |

The preferred F03 local review candidate is [media and hero policy consolidation v2](security-proposals/phase-a/hero-metadata-v2/F03-media-and-hero-policy-consolidation-v2.sql.proposed), an alternative complete transaction rather than an add-on to the original. Original proposals/hashes remain preserved. It is not parsed/runtime-tested or approved to run. Public ready hero reads and lifecycle/size constraints remain intact by design; direct hero writes switch to active property-scoped O/M/E membership with target path validation.

F03's 10 MiB app/bucket upload policy is already prepared locally; no bucket change is needed. Old signed capabilities are not instantly revoked by app/policy changes. Do not automatically restore legacy permissions, rotate secrets or disable real users to force expiry. Existing backup/off-Mac/key-recovery limitations remain explicit release risk decisions.

Git publication, main pushes (Netlify auto-publishes), deployment, production SQL/configuration and real Auth/Storage/CMS/booking/provider mutations require separate operation-specific authorization. No automatic security implementation follows setup closure. Unrelated offline frontend/admin work can proceed while this backlog remains open.

See [the final setup-completion record](BOREALIS-PROJECT-SETUP-COMPLETE.md) for commands, validation and scope, and [the earlier F03 read-only readiness findings](BOREALIS-F03-PRODUCTION-READINESS.md) for runtime/security gates. Earlier plans are historical evidence; they do not reopen local setup.
