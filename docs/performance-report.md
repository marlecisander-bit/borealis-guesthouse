# Performance optimization - 13 September 2026

The public site repeatedly fetched CMS settings, translations and navigation, and waited for lower homepage content before rendering the Hero. Public routes forced uncached rendering, Admin media performed up to ten reference queries per image, and lists returned entire catalogues. Native lazy loading also let streamed footer/map media start loading before the page settled.

## Measurements

Production builds, Chromium, 390 x 844 viewport, DPR 3, three fresh browser contexts per version, same machine and live Supabase content. The original commit is 553f866. Browser network access was enabled and every run verified that the actual Hero image loaded. Earlier sandbox runs that blocked the Hero were discarded. No mobile CPU/network throttling was used: these are laboratory comparisons, not real-user percentiles or a Lighthouse score.

| Metric (median of three runs) | Before | After | Difference |
| --- | ---: | ---: | ---: |
| LCP | 792 ms | 300 ms | 62.1% lower |
| FCP | 792 ms | 300 ms | 62.1% lower |
| TTFB | 579 ms | 76 ms | 86.8% lower |
| CLS | 0  | 0  | unchanged |
| Scripted interaction duration (not field INP) | 32 ms | 32 ms | 0.0% lower |
| Initial JavaScript | 159397 bytes | 149187 bytes | 6.4% lower |
| Initial JS requests | 8  | 7  | 12.5% lower |
| Initial requests | 57  | 37  | 35.1% lower |
| Initial transfer | 2505568 bytes | 2038009 bytes | 18.7% lower |
| Rooms heading visible after navigation | 764 ms | 401 ms | 47.5% lower |

Initial resources are measured through DOMContentLoaded plus three seconds, including browser prefetching and third-party traffic. Navigation measures a client-side /rooms transition until its main heading appears; the room cards and live prices now stream separately. Timing includes automation overhead and varies with network conditions. Event Timing records the scripted menu interactions, not field INP. CLS was zero in all measured initial windows; this is not a claim about every interaction or device.

Server fetch tracing recorded 289 outbound Supabase calls before and 41 after over the three homepage/navigation sequences, including startup cache misses and automatic prefetching. Streaming can finish background work after the measurement window, so this count is an observed workload, not a guarantee per request. Pricing still made uncached requests. Trace output includes table paths, duration and status only, never auth headers, query parameters or guest records.

Raw results: [before](performance/before.json), [after](performance/after.json), [before queries](performance/before-queries.json), [after queries](performance/after-queries.json). Scripts are scripts/performance-audit.mjs and scripts/performance-fetch-trace.mjs. Start a production server with PERF_FETCH_LOG pointing to its JSONL trace; set PERF_ORIGIN for the audit. Run the audit with the same permissions/network access for both builds. Do not run other tests concurrently with measurements.

## Changes

- Next.js 16.3.4 App Router / React 19 retains server components for content. Homepage lower sections and the Rooms catalogue stream through Suspense; only displayed experiences, transfers, gallery images and articles are requested in bounded homepage selections. Hero composition, original files, quality 93 and responsive variants remain intact.
- An anonymous public CMS client opts allowlisted GET requests into Next's five-minute Data Cache. React cache shares common reads within each render. Table tags expire on the corresponding CMS publish actions. Media/publication changes conservatively invalidate shared public content. Locale-specific translation query parameters remain separate cache keys.
- Removed public force-dynamic overrides that defeat CMS fetch caching. Cookie-selected language and previews still require request rendering. The ordinary Supabase transport explicitly uses no-store. Admin, auth, booking records, live inventory, rate calculations and preview reads do not enter the shared CMS cache.
- Central Admin session validation already used request-scoped React cache; the server Supabase client now does too. Proxy and RLS permission enforcement are retained. Public pages use anonymous reads rather than session-aware clients.
- Admin navigation/workspace tabs avoid prefetching every section. Admin search filters use Next Form. Media saves patch local state instead of issuing an additional router refresh. Removed a redundant refresh after physical-room navigation; server actions still invalidate the affected routes.
- Media and Experiences use 24-row database pages, filters and explicit columns. Media usage protection uses ten batched queries per page instead of ten per asset (241 queries down to 11 for 24 assets, including the asset query). Archive checks fail closed. Media pickers use lightweight options without reference scans. Experience editors target their entity and related image/SEO rows.
- Bookings display 25 rows. Reads scan 100-row batches, preserving existing guest, package/service date and room filtering, stopping after the page plus one next-page sentinel. This avoids loading the full dataset for the normal first page and avoids silently losing records beyond Supabase's row cap.
- Date calendar, upload panel, uploader processing and Hero upload transport load on demand. Admin previews use Next image thumbnails. The map iframe and footer background wait until within 400px of the viewport, retaining noscript content and the external Maps link. Other images retain native lazy loading and responsive sizing.
- Manrope and the existing Cormorant weights already use next/font, self-hosted font assets and display swap; retained the typography. No new font weights or third-party packages were introduced. Lightweight public loading feedback complements the existing Admin and booking loading states.
- Netlify retains the standard Next deployment. Hashed /_next/static assets receive an explicit one-year immutable cache policy. No public HTML or authenticated response caching override was added. Netlify/CDN compression remains platform-managed.

## Verification and remaining limits

Production compilation and TypeScript passed; 110 unit tests cover caching exclusions, scoped invalidation, bounded booking filters, batched media protection and the existing booking/Hero logic. ESLint passed. All 24 targeted browser cases passed across desktop and mobile (1440 x 900 and 390 x 844), including Hero source selection and focal points, original upload bytes, responsive layout, booking criteria/navigation, guest validation and map loading.

Authenticated Admin end-to-end timings and real-user INP were not available in this session. The Admin query improvements were verified with repository tests, not fabricated live-account timings. Rare-match/deep booking searches can still scan many batches; a database search RPC is the next step if volume warrants it. Editor media option catalogues, room types and smaller Admin lists remain candidates for further pagination as inventory grows. Root metadata still reads cached property/language CMS data on Admin routes. Live pricing latency and the intentionally high-quality Hero remain material costs; verify regional Netlify cold starts and field Web Vitals after deployment.

## Optional database indexes

Existing migrations already cover CMS publication/order, translations, media property/status/date, room image lookups and booking date filters. No database mutation was made for this pass. Check pg_indexes and EXPLAIN ANALYZE against actual production volume before adding these non-destructive candidates; do not duplicate equivalent indexes. Run CONCURRENTLY statements separately, outside a transaction:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_admin_created_idx
  ON public.bookings (property_id, created_at DESC, id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS booking_guests_booking_lookup_idx
  ON public.booking_guests (booking_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS booking_items_booking_lookup_idx
  ON public.booking_items (booking_id);
```

Deployment target: https://borealisguesthouse.netlify.app/ (existing GitHub/Netlify workflow).
