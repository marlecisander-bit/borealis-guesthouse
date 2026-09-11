# iCal channel synchronization

Apply `database/migrations/20260904_023_ical_channel_sync.sql`, then configure each channel feed in **Admin → Channel calendars**. Import URLs are read only in server code and are protected by owner-only row-level security.

For scheduled synchronization, configure `SUPABASE_SERVICE_ROLE_KEY` and a random `ICAL_SYNC_SECRET` of at least 32 characters in the server environment. A scheduler such as a Netlify Scheduled Function should send `POST /api/internal/calendars/sync` with `Authorization: Bearer <ICAL_SYNC_SECRET>`. A 10–15 minute interval is a sensible starting point; iCal is polling-based and is not real-time.

The public export address is token-protected but should still be treated as a secret. Rotate it in the database if it is disclosed. Exported events contain only generic summaries and dates.

