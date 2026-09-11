-- Owner notifications are durable, property-scoped records. Booking writes do
-- not depend on email delivery: provider attempts happen after commit.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  recipient_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN (
    'booking_created','booking_cancelled','booking_modified',
    'payment_received','experience_activity_booked','transfer_booked'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'booking',
  entity_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id,type,entity_type,entity_id)
);

CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications(property_id,is_read,created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK(channel IN ('email')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
  attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(notification_id,channel,recipient)
);

CREATE INDEX IF NOT EXISTS notification_deliveries_pending_idx
  ON public.notification_deliveries(status,created_at) WHERE status='pending';

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.notification_deliveries FROM anon;
REVOKE INSERT,DELETE,UPDATE ON public.notifications FROM authenticated;
REVOKE INSERT,DELETE,UPDATE ON public.notification_deliveries FROM authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(is_read,read_at,updated_at) ON public.notifications TO authenticated;
GRANT SELECT ON public.notification_deliveries TO authenticated;

DROP POLICY IF EXISTS notifications_admin_read ON public.notifications;
CREATE POLICY notifications_admin_read ON public.notifications FOR SELECT TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]));
DROP POLICY IF EXISTS notifications_admin_update ON public.notifications;
CREATE POLICY notifications_admin_update ON public.notifications FOR UPDATE TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]));
DROP POLICY IF EXISTS notification_deliveries_owner_read ON public.notification_deliveries;
CREATE POLICY notification_deliveries_owner_read ON public.notification_deliveries FOR SELECT TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager']::public.admin_role[]));

-- Existing installations can run this migration repeatedly without resetting
-- owner choices.
INSERT INTO public.site_settings(property_id,setting_key,value_text,value_boolean,is_public,status)
SELECT p.id,seed.setting_key,seed.value_text,seed.value_boolean,FALSE,'published'
FROM public.properties p
CROSS JOIN (VALUES
  ('owner_notification_additional_emails','',NULL::BOOLEAN),
  ('notify_booking_created',NULL,TRUE),
  ('notify_booking_cancelled',NULL,TRUE),
  ('notify_booking_modified',NULL,TRUE)
) AS seed(setting_key,value_text,value_boolean)
ON CONFLICT(property_id,setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enqueue_booking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  event_type TEXT;
  event_title TEXT;
  event_message TEXT;
  queued_notification_id UUID;
  notification_enabled BOOLEAN:=TRUE;
  email_enabled BOOLEAN:=TRUE;
  primary_email TEXT;
  additional_emails TEXT;
  guest_name TEXT;
  room_name TEXT;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.booking_status IN ('pending','awaiting_payment','confirmed','checked_in') THEN
      event_type:='booking_created';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF NEW.booking_status='cancelled' AND OLD.booking_status IS DISTINCT FROM 'cancelled' THEN
    event_type:='booking_cancelled';
  ELSIF OLD.booking_status='held' AND NEW.booking_status IN ('pending','awaiting_payment','confirmed') THEN
    event_type:='booking_created';
  ELSIF NEW.booking_status IN ('pending','awaiting_payment','confirmed','checked_in')
    AND (OLD.check_in,OLD.check_out,OLD.adults,OLD.children,OLD.total_amount)
      IS DISTINCT FROM (NEW.check_in,NEW.check_out,NEW.adults,NEW.children,NEW.total_amount) THEN
    event_type:='booking_modified';
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(s.value_boolean,TRUE) INTO notification_enabled
  FROM public.site_settings s
  WHERE s.property_id=NEW.property_id AND s.setting_key='notify_'||event_type;
  IF NOT COALESCE(notification_enabled,TRUE) THEN RETURN NEW; END IF;

  SELECT trim(concat_ws(' ',g.first_name,g.last_name)) INTO guest_name
  FROM public.booking_guests g WHERE g.booking_id=NEW.id
  ORDER BY g.is_primary DESC,g.created_at LIMIT 1;
  SELECT COALESCE(i.title_snapshot,rt.name,r.title) INTO room_name
  FROM public.booking_items i
  LEFT JOIN public.room_types rt ON rt.id=i.room_type_id
  LEFT JOIN public.rooms r ON r.id=i.room_id
  WHERE i.booking_id=NEW.id AND i.item_type='room' LIMIT 1;

  event_title:=CASE event_type
    WHEN 'booking_cancelled' THEN 'Booking cancelled'
    WHEN 'booking_modified' THEN 'Booking modified'
    ELSE 'New booking'
  END;
  event_message:=concat(
    COALESCE(NULLIF(NEW.reference,''),'Booking'),
    CASE WHEN guest_name IS NOT NULL AND guest_name<>'' THEN ' · '||guest_name ELSE '' END,
    CASE WHEN room_name IS NOT NULL AND room_name<>'' THEN ' · '||room_name ELSE '' END,
    CASE WHEN NEW.check_in IS NOT NULL THEN ' · '||to_char(NEW.check_in,'DD Mon YYYY') ELSE '' END
  );

  INSERT INTO public.notifications(
    property_id,type,title,message,entity_type,entity_id,booking_id,metadata
  ) VALUES(
    NEW.property_id,event_type,event_title,event_message,'booking',NEW.id,NEW.id,
    jsonb_build_object('reference',COALESCE(NEW.reference,''),'source',COALESCE(NEW.source,'direct'))
  )
  ON CONFLICT(property_id,type,entity_type,entity_id) DO NOTHING
  RETURNING id INTO queued_notification_id;

  IF queued_notification_id IS NULL THEN RETURN NEW; END IF;

  -- Delivery preparation is deliberately isolated. A malformed address or
  -- future provider-related schema problem must not roll back the durable
  -- in-app notification created above.
  BEGIN
    SELECT COALESCE(bool_or(s.value_boolean),TRUE) INTO email_enabled
    FROM public.site_settings s
    WHERE s.property_id=NEW.property_id AND s.setting_key='owner_notification_enabled';
    IF COALESCE(email_enabled,TRUE) THEN
      SELECT max(s.value_text) FILTER(WHERE s.setting_key='booking_notification_email'),
             max(s.value_text) FILTER(WHERE s.setting_key='owner_notification_additional_emails')
        INTO primary_email,additional_emails
      FROM public.site_settings s
      WHERE s.property_id=NEW.property_id
        AND s.setting_key IN ('booking_notification_email','owner_notification_additional_emails');
      IF NULLIF(trim(primary_email),'') IS NULL THEN
        SELECT p.email INTO primary_email FROM public.properties p WHERE p.id=NEW.property_id;
      END IF;

      INSERT INTO public.notification_deliveries(
        notification_id,property_id,channel,recipient
      )
      SELECT
        queued_notification_id,NEW.property_id,'email',lower(btrim(address_row.email))
      FROM string_to_table(
        replace(
          replace(concat_ws(',',primary_email,additional_emails),E'\n',','),
          ';',','
        ),
        ','
      ) AS address_row(email)
      WHERE btrim(address_row.email)<>''
        AND position('@' IN address_row.email)>1
        AND position('.' IN split_part(address_row.email,'@',2))>0
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.notifications
    SET metadata=metadata||jsonb_build_object('emailQueueError',left(SQLERRM,300)),updated_at=NOW()
    WHERE id=queued_notification_id;
    RAISE WARNING 'Notification % was saved but email delivery could not be queued: %',queued_notification_id,SQLERRM;
  END;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification defect must never make a valid booking transaction fail.
  RAISE WARNING 'Could not enqueue booking notification for %: %',NEW.id,SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enqueue_booking_notification ON public.bookings;
CREATE TRIGGER enqueue_booking_notification
AFTER INSERT OR UPDATE OF booking_status,check_in,check_out,adults,children,total_amount
ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enqueue_booking_notification();

-- Supabase Realtime must include this private table; RLS still controls which
-- authenticated administrators receive rows.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
     AND NOT EXISTS(
       SELECT 1 FROM pg_publication_tables
       WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
