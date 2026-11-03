# Borealis audit executive summary

2026-10-20 (Europe/Tirane). Canonical repository: `/Users/aleksandermarleci/Desktop/Projects/borealis-guesthouse`. Audit only; no fixes or deployment.

**The informational website runs locally, but the whole platform is not yet verified or ready for a new production release.** This audit found real issues as well as features that simply have not been tested safely. No fixes, production changes, bookings, emails, commits or deployments were made.

## What works, within the checks performed

**PASS:**125 unit tests, ESLint, TypeScript, installed dependency consistency and a new full build with network access blocked. All seven approved local pages return 200 with the preview security headers. Both local fonts load and match their verified files. The existing 318 source files, 500 build artifacts and 22,428 dependency entries remain unchanged. The local server remains running as requested.

The code has real connections for rooms, amenities, rates, room inventory, experiences, transfers, articles, homepage sections, property contacts and much of the page content. Bookings use server-calculated prices, transactions, locks and a database rule against overlapping room reservations. These are useful foundations; they do not replace real isolated workflow testing.

## What is broken or incomplete

**FAIL:** unpublished changes saved alongside published page content are not properly protected by the recorded database permissions. This should be reviewed first. No draft content was fetched and no actual disclosure was demonstrated.

Other confirmed gaps: some translation fields never reach public pages; uploading media does not add it to the public gallery; image archive protection misses some places where photos are used; several admin saves can partially complete; and production robots/sitemap links currently point to localhost. Albanian Lek is offered in admin but rejected by the room/package SQL path. These are specific findings, not claims that every current product/customer is affected.

**PARTIAL:** owner email sending, calendar automation, payment settings and some policy controls. The guest-confirmation-email switch has no guest sender behind it. Payment collection is not implemented merely because settings and a payments table exist. Transfers are not a full shared-seat/fleet system.

**NOT TESTED:** real booking creation/confirmation/cancellation and inventory release, simultaneous last-room requests, authenticated admin saves, live role restrictions, real emails/payments/channel sync, detailed current desktop/mobile acceptance and recovery from backup. Those tests would need an isolated test backend; they were not run against production.

## The five most important work packages

1. **Protect unpublished content and reconcile permissions.** Fix the draft access boundary, internal public writer functions and the old Storage permission model (F01–F03).
2. **Create a safe test environment and prove booking correctness.** Test concurrency, cancellation, response-loss retries, supported currencies and backup recovery without real guests or providers (F12–F14,F27).
3. **Make admin publication reliable and connected.** Atomic saves, correct translations, gallery membership and complete photo reference protection (F04–F07).
4. **Finish operational delivery.** Separate guest confirmation from owner emails, add reliable retries and verify calendar schedules/fetch safety (F08–F11).
5. **Prepare a controlled release.** Correct the live SEO host, keep private browser/runtime material out of Git, review the dirty source diff and align the supported runtime before a separately approved deployment (F15–F17,F23).

## Can you use production/admin/bookings safely now?

**This audit cannot give an unconditional safety approval.** It does not show that the site is currently losing bookings or has been compromised, and it did not shut production down. However, the draft confidentiality issue and permission inconsistencies need attention. Do not rely on the Draft button to keep sensitive editorial content private until F01 is corrected.

**Admin daily-use readiness: PARTIAL, not certified.** Many controls have real backends, but some are misleading or incomplete and no production saves were performed. **Real-customer booking readiness: NOT CERTIFIED.** Strong SQL safeguards exist, but required isolated transaction/concurrency/retry tests are outstanding. **New Mac readiness:** ready to build and browse the restricted informational preview; not yet a complete safe environment for write-capable platform development.

Before the next deployment: complete the priority fixes and isolated acceptance, reconcile the schema/migration baseline, verify backup/recovery and hosting configuration, review only intended source changes, then obtain explicit publication/deployment approval. Do not push everything to main: earlier hosting metadata has automatic production publishing enabled, and private .local material is not Git-ignored.

## Reports

- [Full platform audit and complete inventory](BOREALIS-FULL-PLATFORM-AUDIT.md)
- [Public/admin/database connection matrix](BOREALIS-PUBLIC-ADMIN-CONNECTION-MATRIX.md)
- [Booking engine audit and safe test plan](BOREALIS-BOOKING-ENGINE-AUDIT.md)
- [Security and integrations audit](BOREALIS-SECURITY-INTEGRATIONS-AUDIT.md)
- [UI/UX and mobile evidence](BOREALIS-UI-UX-AUDIT.md)
- [Prioritized remediation roadmap with tests](BOREALIS-REMEDIATION-ROADMAP.md)

The reports distinguish current checks, same-day historical metadata, static findings and untested behavior. Current Netlify control-plane settings, provider readiness and all production data correctness were not exhaustively verified. No technical action is required from the owner merely to read these results.
