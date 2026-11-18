# Booking management and admin push

The existing confirmation URL links to Manage booking. The private confirmation token authorizes guest actions. Staff use their signed-in property account. A booking reference is for identification. The token routes send private caching, referrer and indexing directives. Exclude `/booking/confirmation/*` from any access-log exports, analytics, session replay and email click tracking. No guest confirmation mail sender existed in the application at implementation time. If one is added, send the existing private confirmation link directly.

## Release setup

1. Apply `database/migrations/20261118_043_booking_management.sql` and then `database/migrations/20261118_044_admin_booking_push.sql` to the intended database. Apply both before publishing the application.
2. Review the property's existing cancellation terms. Keep `cancellation_policy_reference` as the policy text shown to guests. Automatic **guest** actions stay off until the property explicitly sets the applicable published `site_settings.value_number` for `guest_change_cutoff_hours` and/or `guest_cancel_cutoff_hours`, with the correct property ID, status `published`, and `is_public=false`. Hours count back from midnight at the start of the check-in date in Europe/Tirane. Guest cancellation also requires policy text. Review the matching terms before enabling either action. Leave the row absent to use staff review. New dates also follow existing advance-notice, horizon, rate and capacity rules.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the server-only `SUPABASE_SERVICE_ROLE_KEY` for the same database. Keep the existing `RESEND_API_KEY` and `RESEND_FROM_EMAIL` if admin email is enabled.
4. Generate one VAPID key pair per environment with `npx web-push generate-vapid-keys`. Store its values as `BOOKING_PUSH_VAPID_PUBLIC_KEY` and `BOOKING_PUSH_VAPID_PRIVATE_KEY`. Set `BOOKING_PUSH_VAPID_SUBJECT` to a real operations contact such as `mailto:operations@example.com`. Generate a high-entropy `BOOKING_PUSH_WORKER_SECRET` of at least 32 bytes and set `APP_URL` to the canonical HTTPS site origin. Add these values to the Netlify Functions runtime scope. Give the Next server runtime and the scheduled function the same worker secret. Keep the private key and worker secret out of public build variables and source control.
5. Netlify discovers `netlify/functions/booking-push-scheduler.mts` and schedules it every minute on published production deploys. It issues an authenticated POST to `/api/internal/booking-push`. Verify the function's latest invocation in Netlify. For an isolated acceptance run, invoke the same route on the test deployment with `Authorization: Bearer <worker secret>`. The endpoint returns claim and completion counts. Failed invocations leave leased jobs for retry. See [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/).

## Eligibility and review

Immediate changes cover future confirmed direct or manually entered stays with one room, one physical reservation, no add-ons or extra fees, a pending payment status and pay-at-property terms. A payment record, changes requiring a different room, mismatched currency, external booking, package, standalone activity or transfer requires staff handling. The guest's change is priced again and confirmed against the original quote. An inventory conflict or stale quote leaves the booking untouched.

A guest can submit a change or cancellation request from Manage booking. Staff find it in **Bookings → Guest booking requests** and review it on the reservation page. Marking it reviewed leaves the booking status intact. The existing staff status workflow remains available, including cases with separate payment or refund arrangements. An actual cancellation changes inventory and item status through the existing lifecycle triggers. The action does not issue a refund.

## Devices and troubleshooting

Sign in as owner, manager or staff, open **Notifications**, and tap **Enable on this device**. Allow notifications and wait for the registration message. Tap **Send test notification** to queue a push for that device. The last-test status shows whether the provider accepted it. Acceptance does not prove a phone displayed it. A subsequent booking alert opens the matching signed-in booking. Test notifications open Notifications.

For an iPhone or iPad running iOS/iPadOS 16.4 or later:

1. Open the HTTPS admin page in Safari and sign in.
2. Tap **Share → Add to Home Screen**. Choose **Open as Web App** if the OS offers it.
3. Close Safari and open **Borealis Admin** using its Home Screen icon. Sign in again if prompted.
4. Go to **Notifications**, tap **Enable on this device**, and tap **Allow** when prompted.
5. Tap **Send test notification**. Wait for the next scheduler run and confirm both the banner and provider status. Tap the banner to open Notifications. With a synthetic booking event, tap its banner and confirm it opens the matching admin record.
6. Tap **Disable on this device** and verify the next synthetic event does not notify that installation. [WebKit Home Screen Web Push requirements](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Use **Disable on this device** before handing a shared browser to someone else. Admin sign-out attempts server revocation and browser unsubscribe for this device. Revoking the admin's property access also prevents future queued deliveries when the worker rechecks membership. Removing a Home Screen app or clearing its data can invalidate the endpoint. Definitive provider expiration responses retire that device, and the panel can register a fresh subscription. Keep VAPID keys stable across deploys. Rotating them requires device re-enrollment.

Pending delivery is retried up to five attempts on rate limiting and temporary provider responses. Network failures with unknown acceptance are marked uncertain. An abandoned lease may be retried with the same notification tag. The admin inbox and existing admin email channel continue independently of push.

## Borealis Admin installation release

The manifest is `/admin/manifest.webmanifest`. The install identity and scope are `/admin/`, the start URL is `/admin/dashboard`, and the display mode is standalone. The Apple touch icon is `/admin/apple-touch-icon.png`. The existing push-only service worker at `/admin/sw.js` uses the same admin scope. It does not intercept requests or use Cache Storage. Admin pages and admin APIs send private, no-store cache instructions.

For an existing installation with working booking alerts, keep the installed migrations, VAPID pair and worker secret. This installation update adds no database migration. For a fresh isolated environment, use the release setup above. When releasing with the separate Team & Access work, follow its migration and owner verification guide too.

Deploy the application and scheduled function to an HTTPS test site, sign in through Safari, and complete the Home Screen steps above. Confirm that the icon opens the admin dashboard. Use a synthetic booking to verify an alert with the app closed and again while signed out. The app should return to that booking after sign-in. The booking still uses the signed-in account's current property access. Verify the server-confirmed device state, delivery status and disablement on the same installation. When the test environment is ready for a production release, publish the tested build through the existing Netlify workflow.
