# Owner notifications

Run `database/migrations/20260905_031_owner_notifications.sql` after migration 030. It creates the private notification and delivery-log tables, the idempotent booking-event trigger, property-scoped RLS policies, and the Supabase Realtime publication entry.

Configure notification recipients and event preferences in **Admin → Settings → Notifications**. The bell and `/admin/notifications` use the signed-in administrator's property access and do not expose notifications publicly.

Email delivery uses the server-side Resend adapter. Configure these deployment environment variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` using a Resend-verified sender/domain
- `APP_URL` (recommended) or `NEXT_PUBLIC_APP_URL` for absolute **View booking** links

Never prefix the service-role or Resend credentials with `NEXT_PUBLIC_`. If provider configuration is absent or delivery fails, the booking remains successful and the delivery record remains visible as pending or failed. In-app notifications continue to work independently.

The adapter implements the shared `NotificationChannel` interface. A future SMTP, Supabase Edge Function, or another provider can be introduced without changing booking creation or the notification data model.
