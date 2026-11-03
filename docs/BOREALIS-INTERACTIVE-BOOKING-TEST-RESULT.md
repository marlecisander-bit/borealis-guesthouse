# Borealis interactive booking fixture — test result

21 October2026, Europe/Tirane. Canonical repository `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`.

**Fixture harness preparation and offline interactive validation PASS. Persistent interactive interface NOT STARTED. Production booking readiness PARTIAL / live integration NOT TESTED.** No HTTP server was started, the existing preview PID18704 on127.0.0.1:3000 remains unchanged, and its /book restriction was preserved. No production connection, booking/Auth/Storage/CMS write, SQL, notification, payment, Git publication, deployment, Netlify/Docker operation or infrastructure resource creation occurred.

## Implementation

This is a private **standalone static HTML bundle**, not a Next route, production feature flag or new backend environment. It mounts actual canonical BookingFlow, useBooking, date/guest controls, bookingService, pricing and allocation modules. Next Image is replaced with a data-image-only adapter; Next router navigation is recorded in memory. No BookPage SSR, PublicShell, Supabase client, repository, Auth or provider module is loaded. Build import traversal refuses unlisted/server/database/provider dependencies; unexpected fixture requests have no native-network fallback.

| File | Purpose |
| --- | --- |
| `tools/booking-fixture/build.mjs` | Guarded generator, explicit module graph, CSS compilation, production/hosting/configuration rejection, standalone runtime guards and hashed CSP script |
| `tools/booking-fixture/fixtures.mjs` | Strict in-memory transport for pricing/hold/confirm and harness-only cancellation; synthetic inventory and actual JS pricing/allocation |
| `tools/booking-fixture/browser-tests.mjs` | Ephemeral headless desktop/mobile workflow and escape tests, screenshots and status evidence |
| `tools/booking-fixture/run.py` | Sterile pinned-runtime wrapper; deny-IP policy with negative controls; build/test commands and separately gated future interactive opening procedure |
| `tools/booking-fixture/README.md` | Repeatable usage, safety boundary and limitations |
| `tests/booking-fixture-isolation.test.ts` | Six focused behavior/isolation/production-guard regressions |
| `scripts/borealis-safe-checks.py` | Narrow addition to copy the test-only tooling into private validation snapshots so unit imports can resolve; no startup or production behavior added |

No `src/` application file, `.env.local`, package/lockfile, existing F01/F03 preparation or preview policy/build was edited. Runtime fixture tooling remains outside src/public. Generated HTML, manifests, logs and screenshots are ignored under `.local/booking-fixture-v1/`. Delivery file hashes are recorded in its `delivery-manifest.json`.

Example state:16–20November2026,2 adults/0 children/0 infants. Test clock is explicitly pinned to21October2026 in this isolated browser bundle so the example stays deterministic; production clock/code is unchanged. Double-room pricing uses80+80+100+100 = **EUR360**, and the family fixture totalsEUR600. Six adults receive a two-room combination. Scenario selector covers available/multi-room/empty/pricing-failure/hold-failure/confirmation-failure. All rooms, images, guests and references are synthetic.

Fictional reference **FICTIONAL-BOREALIS-0001** and token **FIXTURE-TOKEN-NOT-VALID** never leave the fixture transport. Confirmation uses the real BookingFlow UI; navigation is intercepted by the router adapter. Cancellation is an explicitly labelled **harness-only control** and state transition, not an implemented production guest cancellation feature. Reset/reload discards memory. Enter fictional guest details only.

## Dependency classification

| Normal application dependency | Classification | Harness handling |
| --- | --- | --- |
| BookPage/PublicShell/SEO/CMS/translations/add-on/age-policy readers | Read-intended database/content calls; no whole-call-graph purity claim | Not executed; initial props, empty add-ons and local styling supplied directly |
| Normal Next Supabase SSR/proxy/Auth client | Session/cookie/refresh-capable; may contact Auth | Entirely excluded; no production sessions imported |
| POST /api/pricing | Read-intended availability/price API, not certified mutation-free | Actual bookingService request answered in memory |
| available_room_count / calculate_room_stay_price | Database RPCs; behavior requires separate live acceptance | Never executed; actual JS catalog/allocation with synthetic data |
| Room selection/guest fields | Local React state | Actual components/hooks tested |
| POST /api/bookings/hold and nested create_multi_room_booking_package_hold/expiry/reference helpers | Mutation-capable reservations/counters/expiry | HTTP/RPC never reached; fictional in-memory hold only |
| POST /api/bookings/confirm, confirm_booking_hold and notification after-hook | Mutation-capable reservation/provider effects | Fictional transport response; no server handler/provider module |
| Admin cancellation/status and inventory release | Database mutation-capable | Not called; separate clearly labelled synthetic cancellation control |
| Public photos / Next optimizer | Read-capable outbound traffic | Data-URI synthetic raster placeholder only; no optimizer or Storage request |

All dependency observations are code tracing, not new live database inspection. The current server remains the restricted informational snapshot described by the prior [failure investigation](BOREALIS-BOOKING-ENGINE-FAILURE-RESULT.md).

## Network and deployment boundary

- Generator requires explicit BOREALIS_BOOKING_FIXTURE=1 and rejects NODE_ENV=production, Netlify/CONTEXT/VERCEL/CI and credential-bearing Supabase/provider configuration. The wrapper supplies a sterile environment, never loads dotenv and refuses hosting/production invocation.
- Generated runtime accepts a local file or an explicitly marked headless about:blank test context only; hosted HTTP origins fail before mounting. No runtime flag is added to production application source.
- The fixture fetch replacement accepts only exact local virtual endpoints, POST JSON and expected headers; external hosts/ports, RPCs, queries/encoded paths, credentials, cookies, server actions and unexpected URLs/methods are rejected. No request delegates to native fetch.
- Native XHR, WebSocket, EventSource, workers, popup opening, sendBeacon and service-worker registration are blocked. CSP has default-src:none, connect-src:none, form-action:none, frame/object/worker denial, data-image-only sources and a SHA256-bound inline script.
- Headless contexts abort every actual request and use fresh ephemeral profiles with service workers blocked. OS policy denies **all IP outbound/inbound/listening** while permitting the Unix-domain IPC Chrome needs. Before each run/open, loopback connection, external-IP connection and IP-listener negative controls must fail with permission errors. No generic network exception was added.
- Future persistent opening is through the prepared OS-denied, separate-empty-profile procedure, not a normal signed-in Chrome window. A manifest binds HTML/tool/source hashes, and matching passing headless acceptance is required. It starts no HTTP server and cannot alter the preview listener.

The first headless attempt could not create Chrome's Unix-domain process socket under deny-all networking. Restricting the policy to deny IP operations retained network protection while permitting local browser IPC; negative controls passed. A test false positive and standalone default-import/locator issues were corrected within fixture tooling only. No restriction was weakened on the existing preview. There is no independent packet capture or claim about arbitrary software outside these test/browser processes.

Production exclusion check: all **503 normal Next build artifacts** were rehashed and scanned for the fixture runtime marker, fictional reference and fixture room strings: **zero matches**. There is no fixture entry point under src/app or public, no fixture import in runtime app source, and no change to Netlify build settings. Do not copy generated HTML into public or a deployment; the guarded opening procedure is the supported path.

## Interactive results

| Case | Desktop1440×900 | Mobile390×844 |
| --- | --- | --- |
| Exact date and party prefill | PASS | PASS |
| Available options and EUR360 seasonal quote | PASS | PASS |
| Single-room selection → enhancements → guest details → review | PASS | PASS |
| Blank guest details block review; fictional complete details proceed | PASS | PASS |
| Fictional confirmation/reference | PASS | PASS |
| Harness-only synthetic cancellation | PASS | PASS |
| Six-adult multi-room display/selection | PASS | PASS |
| Empty availability and pricing error | PASS | PASS |
| Hold and confirmation failure UI | PASS | PASS |
| Horizontal overflow | 0px | 0px |
| Unexpected URL/action/native-network escape probes |7/7 denied |7/7 denied |
| Actual outgoing requests observed by context routing |0 |0 |
| Unhandled page errors in workflow |0 |0 |

Screenshots `availability-1440.png`, `availability-390.png`, `confirmation-1440.png` and `confirmation-390.png` are private in the fixture directory. Desktop/mobile availability images were visually inspected. Checks establish these two viewports and synthetic workflows, not every browser/device or full accessibility acceptance. The real component still describes options as live-priced; the prominent fixture banner supersedes that normal copy in this test interface.

## Validation and integrity

| Check | Result |
| --- | --- |
| Focused booking/allocation/pricing/isolation tests | **36/36 PASS** |
| Full canonical unit suite | **182/182 PASS**, zero failed/skipped |
| TypeScript / ESLint | **PASS** |
| Additional fixture JavaScript lint / Python parse | **PASS** |
| Clean production-style Next16.3.4 Webpack build | **PASS**, pinned Node20.19.5/npm10.8.2; OS deny network* |
| Production artifact identity | **503 hashes verified**, zero fixture-marker inclusion |
| Dependencies | **22,428 entries unchanged**, no install/download |
| Standalone fixture HTML SHA256 | `0789f4bad4f0b197a9d536221509afcea9877856628249c1e59fe8879bde4140` |
| Source graph | **24 source/vendor/tool files** hash-bound; no production configuration included |
| Persistent interface / server startup | **NOT STARTED**; only ephemeral headless in-memory UI tests ran |

Final production-style evidence: `.local/safe-checks-20261021T132851027251Z/`. Standalone fixture/browser/negative-control evidence remains `.local/booking-fixture-v1/`. The application build itself uses the unchanged canonical source plus its pre-existing F01/preview preparation; it is not authorization to publish the dirty working tree. F01/F02/F03 behavior and SQL proposals were preserved.

## Remaining functional and backend gaps

This makes the real booking interface usable with controlled fixtures; it does not prove live inventory, SQL pricing/currency handling (including recorded ALL issue), locking/concurrency, real hold expiry, duplicate/idempotent retries, notifications, cancellation release, add-on capacity or admin visibility. Backend error text here is deliberately simulated. Fixture guest validation is enough for synthetic UI tests and is not a replacement for authoritative server validation or abuse controls.

Normal guest self-service cancellation is not provided by this harness as an application feature. The cancellation control demonstrates only synthetic cancellation UI/state. Add-ons are empty in this fixture version; provider/payment and real cancellation integrations were intentionally excluded. F12 retry/idempotency and F27 SQL currency acceptance remain separate work. No tested workflow required an application repair in this task; only the harness integration needed correction.

**Production booking readiness remains PARTIAL / live integration NOT TESTED.** Passing fixtures do not authorize real bookings or waive security/recovery gates.

## Exact opening instructions — future startup, not performed

The validated file is:

`.local/booking-fixture-v1/index.html`

It is not served at /book on port3000. Do not unblock the preview, run unrestricted npm run dev with production dotenv, or double-click the HTML in a normal signed-in browser as a substitute for the network-denied opening procedure.

After explicitly authorizing interactive startup, from the canonical repository run:

```sh
python3 tools/booking-fixture/run.py open --fixtures-only --allow-interactive-start
```

This opens the local HTML in a new empty, task-owned Chrome profile under the deny-IP policy after identity/acceptance checks. No login or database is needed. Use only fictional details and select the scenario in the yellow fixture banner. Close that dedicated window to finish; do not kill unrelated Chrome/server processes by name or port. If source/HTML identity changes, the launcher stops; rebuild/retest first:

```sh
python3 tools/booking-fixture/run.py test --fixtures-only
```

That command performs ephemeral automated validation only and does not open the persistent interface. [Tool usage notes](../tools/booking-fixture/README.md). No previously approved startup procedure existed for this new fixture, so **the interactive opening command was not invoked**. Preparation stops here.
