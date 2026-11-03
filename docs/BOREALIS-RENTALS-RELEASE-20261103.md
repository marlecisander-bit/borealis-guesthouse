# Rental release — 3 November 2026

The existing Supabase project `rlqyruulxyanfgvnzkpe` and Borealis Guesthouse property `a7c8be03-4e80-429d-98f1-c638a0e68408` were verified. The release uses the existing main/Netlify path. No additional hosted environment, password reset or plan upgrade was made.

## Recovery and schema readiness

A fresh encrypted logical database and password-free role export completed on 3 November. Its AES-256-GCM authentication and existing macOS Keychain access passed. The archive restored successfully in a disposable, networkless Supabase PostgreSQL **17.6** container. All **103** archived table-data entries matched row counts and multiset checksums. The container and its plaintext tmpfs were removed. Previous archives were preserved.

The separately encrypted media package authenticated successfully. All **71 current public-media objects**, totalling **88,411,326 bytes**, were downloaded read-only and matched its archived plaintext checksums. Database Auth/Storage records are included in the logical backup; object bytes are in that separate package. Hosted configuration, provider credentials, JWT/signing material, platform service passwords and Vault encryption keys remain separate recovery dependencies. Off-site retention and independent recovery after loss of the local Keychain were not established by this task. Keys and credentials are not committed.

There is no migration registry. Actual live columns, types, constraints, indexes, functions and ownership/ACLs, policies, RLS, triggers and role memberships were compared with the fresh restored database. All public function definitions and grants matched. The single constraint deparse difference was an equivalent array-versus-element text cast in the unrelated amenity icon check. The legacy guard and confirmation drift checks matched. Migration 040 and the strengthened postcheck passed on the restored copy.

## Database and inactive catalogue

Migration **040 committed**. The live postcheck exposed Supabase default function grants that also granted anonymous execution of the two receipt RPCs. Their internal authentication checks still denied anonymous callers. The excess grants were immediately revoked; idempotent migration **041** records that correction. Migration 040 now explicitly removes platform default grants for fresh installations. The release postcheck raises an exception if these grants recur, and a regression test reproduces the platform defaults.

The strengthened live postcheck passed. Both new tables have RLS, no anonymous/authenticated direct allocation or receipt writes, no public internal quote helper, public quote/hold RPCs and authenticated receipt RPCs with tenant/role enforcement. Anonymous PostgREST receipt/balance requests return permission denial. Schema visibility and rejection of inactive rental booking attempts passed through actual PostgREST.

Created only missing **Boat rental, Single kayak and Double kayak** inactive drafts. Paddle Rental was matched and skipped; no separate SUP duplicate was created or existing product converted. Personalized Dinner and Paddle Rental retain their published legacy configuration. New drafts have no booking modes enabled; the two unverified kayaks remain inactive. No real bookings, reservations or receipts were rewritten.

## Validation and remaining acceptance

All **208 tests** pass, including the new default-privilege regression. The changed test passes ESLint. Previous TypeScript, production build, local browser and concurrency evidence remains applicable to unchanged application code. The final corrected migration and postcheck also pass against the fresh restored production schema.

The candidate application connected to the actual project passed catalogue checks at 390, 768 and 1440 pixels, actual media loading, no overflow/page errors, existing experience details, rooms, transfers and booking-page rendering. Drafts remain absent publicly; disabled rental quote/availability checks pass. These checks created no bookings or receipts.

Positive rental allocation, confirmation/cancellation, expiry, snapshots, room-package integration and payment recording have local fixture/native test coverage. This document does not represent them as normal-user hosted acceptance. Actual owner/editor/staff sessions and an isolated acceptance inventory remain necessary before enabling rentals. Production confirmation/cancellation notifications are enabled; avoid external test messages and never record simulated money as a real receipt. Online rental payments remain unavailable.

Before enabling a product, confirm SUP occupancy and adult/child rules; classify additional kayaks; review collection/return and daily hours; configure reviewed boat daylight dates; supply safety, meeting-point, cancellation and weather instructions; review existing media; choose offline/advance payment instructions; and resolve beach-entry applicability. Undefined charges remain unset. These decisions do not prevent inactive draft preparation or deployment of disabled functionality.

## Private operator evidence and recovery

Private recovery tooling, encrypted export, authenticated table checks, live-service receipts and responsive screenshots are under `.local/rental-recovery-20261103/`. The earlier candidate manifest and old recovery packages remain intact. These files are ignored by Git.

If a problem occurs, disable affected rental booking switches and retain bookings, allocations, receipts and snapshots. Do not drop the new tables. Do not serve active rental bookings through a pre-rental application rollback. Use the verified logical backup and separately verified media package with the existing project procedure; platform secrets require their separate operator recovery source.
