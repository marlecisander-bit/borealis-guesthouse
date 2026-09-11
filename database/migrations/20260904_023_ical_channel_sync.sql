-- iCal channel synchronization. Imported events are mirrored into the central
-- availability_blocks table so every booking path uses the same inventory truth.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.external_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'other' CHECK(provider IN ('booking_com','airbnb','other')),
  name TEXT NOT NULL CHECK(char_length(trim(name)) BETWEEN 2 AND 120),
  calendar_url TEXT,
  export_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'),
  direction TEXT NOT NULL DEFAULT 'import' CHECK(direction IN ('import','export','both')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT NOT NULL DEFAULT 'never' CHECK(last_sync_status IN ('never','syncing','success','error')),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT external_calendars_one_target CHECK((room_id IS NOT NULL)::int + (room_type_id IS NOT NULL)::int = 1),
  CONSTRAINT external_calendars_import_url CHECK(direction='export' OR calendar_url IS NOT NULL),
  CONSTRAINT external_calendars_export_token_format CHECK(export_token ~ '^[a-f0-9]{64}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS external_calendars_export_token_uidx ON public.external_calendars(export_token);
CREATE INDEX IF NOT EXISTS external_calendars_sync_idx ON public.external_calendars(enabled,direction,last_synced_at);
CREATE INDEX IF NOT EXISTS external_calendars_property_idx ON public.external_calendars(property_id,provider,created_at);

CREATE TABLE IF NOT EXISTS public.external_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_calendar_id UUID NOT NULL REFERENCES public.external_calendars(id) ON DELETE CASCADE,
  external_uid TEXT NOT NULL CHECK(char_length(trim(external_uid)) BETWEEN 1 AND 500),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled','removed')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(end_date>start_date),
  UNIQUE(external_calendar_id,external_uid)
);
CREATE INDEX IF NOT EXISTS external_calendar_events_range_idx
  ON public.external_calendar_events(external_calendar_id,status,start_date,end_date);

ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS external_calendar_event_id UUID REFERENCES public.external_calendar_events(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS availability_blocks_external_event_uidx
  ON public.availability_blocks(external_calendar_event_id) WHERE external_calendar_event_id IS NOT NULL;

ALTER TABLE public.external_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS external_calendars_owner_manage ON public.external_calendars;
CREATE POLICY external_calendars_owner_manage ON public.external_calendars FOR ALL TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner']::public.admin_role[]));
DROP POLICY IF EXISTS external_calendar_events_owner_manage ON public.external_calendar_events;
CREATE POLICY external_calendar_events_owner_manage ON public.external_calendar_events FOR ALL TO authenticated
  USING(EXISTS(
    SELECT 1 FROM public.external_calendars c
    WHERE c.id=external_calendar_id
      AND public.can_manage_property(c.property_id,ARRAY['owner']::public.admin_role[])
  ))
  WITH CHECK(EXISTS(
    SELECT 1 FROM public.external_calendars c
    WHERE c.id=external_calendar_id
      AND public.can_manage_property(c.property_id,ARRAY['owner']::public.admin_role[])
  ));

DROP TRIGGER IF EXISTS set_external_calendars_updated_at ON public.external_calendars;
CREATE TRIGGER set_external_calendars_updated_at BEFORE UPDATE ON public.external_calendars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_external_calendar_events_updated_at ON public.external_calendar_events;
CREATE TRIGGER set_external_calendar_events_updated_at BEFORE UPDATE ON public.external_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validate that channel targets belong to the selected property. The URL stays
-- protected by owner-only RLS and is never selected by the public application.
CREATE OR REPLACE FUNCTION public.validate_external_calendar_target() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.room_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.rooms WHERE id=NEW.room_id AND property_id=NEW.property_id
  ) THEN RAISE EXCEPTION 'Calendar room does not belong to this property' USING ERRCODE='23514'; END IF;
  IF NEW.room_type_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.room_types WHERE id=NEW.room_type_id AND property_id=NEW.property_id
  ) THEN RAISE EXCEPTION 'Calendar room type does not belong to this property' USING ERRCODE='23514'; END IF;
  IF NEW.calendar_url IS NOT NULL AND NEW.calendar_url !~* '^https://' THEN
    RAISE EXCEPTION 'Calendar import URL must use HTTPS' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_external_calendar_target ON public.external_calendars;
CREATE TRIGGER validate_external_calendar_target BEFORE INSERT OR UPDATE OF property_id,room_id,room_type_id,calendar_url
  ON public.external_calendars FOR EACH ROW EXECUTE FUNCTION public.validate_external_calendar_target();

-- Mirror normalized channel events to the existing inclusive-date block model.
CREATE OR REPLACE FUNCTION public.mirror_external_calendar_event() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.external_calendars%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.external_calendars WHERE id=NEW.external_calendar_id;
  INSERT INTO public.availability_blocks(
    property_id,room_id,room_type_id,start_date,end_date,reason_code,reason,
    internal_notes,source,external_uid,external_calendar_event_id,status,sync_metadata
  ) VALUES(
    c.property_id,c.room_id,c.room_type_id,NEW.start_date,NEW.end_date-1,
    'external_calendar','Reserved via external channel',NULL,'ical',
    c.id::text||':'||NEW.external_uid,NEW.id,
    CASE WHEN c.enabled AND c.direction IN ('import','both') AND NEW.status='active'
      THEN 'published'::public.content_status ELSE 'archived'::public.content_status END,
    jsonb_build_object('provider',c.provider,'calendar_id',c.id)
  )
  ON CONFLICT(external_calendar_event_id) WHERE external_calendar_event_id IS NOT NULL DO UPDATE SET
    property_id=EXCLUDED.property_id,room_id=EXCLUDED.room_id,room_type_id=EXCLUDED.room_type_id,
    start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,reason=EXCLUDED.reason,
    source=EXCLUDED.source,external_uid=EXCLUDED.external_uid,status=EXCLUDED.status,
    sync_metadata=EXCLUDED.sync_metadata,updated_at=NOW(),
    archived_at=CASE WHEN EXCLUDED.status='archived' THEN NOW() ELSE NULL END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mirror_external_calendar_event ON public.external_calendar_events;
CREATE TRIGGER mirror_external_calendar_event AFTER INSERT OR UPDATE OF start_date,end_date,status,external_uid
  ON public.external_calendar_events FOR EACH ROW EXECUTE FUNCTION public.mirror_external_calendar_event();

CREATE OR REPLACE FUNCTION public.refresh_external_calendar_blocks() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.availability_blocks ab SET
    property_id=NEW.property_id,room_id=NEW.room_id,room_type_id=NEW.room_type_id,
    status=CASE WHEN NEW.enabled AND NEW.direction IN ('import','both') AND e.status='active'
      THEN 'published'::public.content_status ELSE 'archived'::public.content_status END,
    archived_at=CASE WHEN NEW.enabled AND NEW.direction IN ('import','both') AND e.status='active' THEN NULL ELSE NOW() END,
    sync_metadata=jsonb_build_object('provider',NEW.provider,'calendar_id',NEW.id),updated_at=NOW()
  FROM public.external_calendar_events e
  WHERE e.external_calendar_id=NEW.id AND ab.external_calendar_event_id=e.id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS refresh_external_calendar_blocks ON public.external_calendars;
CREATE TRIGGER refresh_external_calendar_blocks AFTER UPDATE OF enabled,direction,room_id,room_type_id,provider
  ON public.external_calendars FOR EACH ROW EXECUTE FUNCTION public.refresh_external_calendar_blocks();

-- Serialize booking/block/channel writes per property. iCal cannot prevent a
-- remote race, but local imports and direct booking creation no longer interleave.
CREATE OR REPLACE FUNCTION public.lock_property_inventory() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lock_booking_inventory ON public.bookings;
CREATE TRIGGER lock_booking_inventory BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.lock_property_inventory();
DROP TRIGGER IF EXISTS lock_availability_block_inventory ON public.availability_blocks;
CREATE TRIGGER lock_availability_block_inventory BEFORE INSERT OR UPDATE OF start_date,end_date,status ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.lock_property_inventory();

-- The hold function selects its room before inserting the booking row. Recheck
-- central blocks when the reservation is written so a concurrent import cannot
-- slip between room selection and hold creation.
CREATE OR REPLACE FUNCTION public.guard_room_reservation_availability() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));
  IF NEW.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND EXISTS(
    SELECT 1 FROM public.availability_blocks ab JOIN public.rooms r ON r.id=NEW.room_id
    WHERE ab.property_id=NEW.property_id AND ab.status='published'
      AND (ab.room_id=NEW.room_id OR ab.room_type_id=r.room_type_id)
      AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(NEW.check_in,NEW.check_out,'[)')
  ) THEN
    RAISE EXCEPTION 'Room inventory is blocked for these dates' USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_room_reservation_availability ON public.room_reservations;
CREATE TRIGGER guard_room_reservation_availability BEFORE INSERT OR UPDATE OF room_id,check_in,check_out,booking_status
  ON public.room_reservations FOR EACH ROW EXECUTE FUNCTION public.guard_room_reservation_availability();

-- One RPC is one PostgreSQL transaction: upsert current VEVENTs, retire events
-- absent from the latest successful feed, and record the successful sync.
CREATE OR REPLACE FUNCTION public.sync_external_calendar_events(target_calendar UUID,event_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.external_calendars%ROWTYPE; marker TIMESTAMPTZ:=clock_timestamp(); seen_count INTEGER; removed_count INTEGER;
BEGIN
  SELECT * INTO c FROM public.external_calendars WHERE id=target_calendar FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'External calendar not found' USING ERRCODE='P0002'; END IF;
  IF auth.role()<>'service_role' AND NOT public.can_manage_property(c.property_id,ARRAY['owner']::public.admin_role[]) THEN
    RAISE EXCEPTION 'Not authorized to synchronize this calendar' USING ERRCODE='42501';
  END IF;
  IF NOT c.enabled OR c.direction NOT IN ('import','both') THEN
    RAISE EXCEPTION 'Calendar import is disabled' USING ERRCODE='55000';
  END IF;
  IF jsonb_typeof(event_payload)<>'array' THEN RAISE EXCEPTION 'Event payload must be an array' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_to_recordset(event_payload) x(uid TEXT,start_date DATE,end_date DATE,status TEXT) GROUP BY uid HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Calendar feed contains duplicate UIDs' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(c.property_id::text));

  INSERT INTO public.external_calendar_events(external_calendar_id,external_uid,start_date,end_date,summary,description,status,last_seen_at)
  SELECT c.id,trim(x.uid),x.start_date,x.end_date,NULLIF(x.summary,''),NULLIF(x.description,''),
    CASE WHEN lower(COALESCE(x.status,'active'))='cancelled' THEN 'cancelled' ELSE 'active' END,marker
  FROM jsonb_to_recordset(event_payload) x(uid TEXT,start_date DATE,end_date DATE,summary TEXT,description TEXT,status TEXT)
  WHERE trim(COALESCE(x.uid,''))<>'' AND x.start_date IS NOT NULL AND x.end_date>x.start_date
  ON CONFLICT(external_calendar_id,external_uid) DO UPDATE SET
    start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,summary=EXCLUDED.summary,
    description=EXCLUDED.description,status=EXCLUDED.status,last_seen_at=marker,updated_at=NOW();
  GET DIAGNOSTICS seen_count=ROW_COUNT;

  UPDATE public.external_calendar_events SET status='removed',updated_at=NOW()
  WHERE external_calendar_id=c.id AND last_seen_at<marker AND status<>'removed';
  GET DIAGNOSTICS removed_count=ROW_COUNT;
  UPDATE public.external_calendars SET last_synced_at=NOW(),last_sync_status='success',last_sync_error=NULL WHERE id=c.id;
  RETURN jsonb_build_object('seen',seen_count,'removed',removed_count,'synced_at',marker);
END $$;
REVOKE ALL ON FUNCTION public.sync_external_calendar_events(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_external_calendar_events(UUID,JSONB) TO authenticated,service_role;

-- Token-scoped, privacy-safe rows consumed by /api/calendars/[token].ics.
CREATE OR REPLACE FUNCTION public.is_external_calendar_export_enabled(target_token TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.external_calendars WHERE export_token=target_token AND enabled AND direction IN ('export','both'));
$$;
REVOKE ALL ON FUNCTION public.is_external_calendar_export_enabled(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_external_calendar_export_enabled(TEXT) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.get_external_calendar_export_events(target_token TEXT)
RETURNS TABLE(uid TEXT,start_date DATE,end_date DATE,summary TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH calendar AS (
  SELECT c.*,COALESCE(c.room_type_id,r.room_type_id) AS target_room_type
  FROM public.external_calendars c LEFT JOIN public.rooms r ON r.id=c.room_id
  WHERE c.export_token=target_token AND c.enabled AND c.direction IN ('export','both')
), booking_rows AS (
  SELECT 'booking-'||rr.id::text||'@borealis' AS uid,rr.check_in AS start_date,rr.check_out AS end_date,'Borealis Booking'::TEXT AS summary
  FROM calendar c JOIN public.room_reservations rr ON rr.property_id=c.property_id
  JOIN public.rooms r ON r.id=rr.room_id JOIN public.bookings b ON b.id=rr.booking_id
  WHERE b.booking_status IN ('confirmed','checked_in')
    AND ((c.room_id IS NOT NULL AND rr.room_id=c.room_id) OR (c.room_type_id IS NOT NULL AND r.room_type_id=c.room_type_id))
), block_rows AS (
  SELECT 'block-'||ab.id::text||'@borealis',ab.start_date,ab.end_date+1,'Reserved'::TEXT
  FROM calendar c JOIN public.availability_blocks ab ON ab.property_id=c.property_id AND ab.status='published'
  LEFT JOIN public.rooms blocked_room ON blocked_room.id=ab.room_id
  LEFT JOIN public.external_calendar_events imported_event ON imported_event.id=ab.external_calendar_event_id
  WHERE (imported_event.external_calendar_id IS NULL OR imported_event.external_calendar_id<>c.id)
    AND ((c.room_id IS NOT NULL AND (ab.room_id=c.room_id OR ab.room_type_id=c.target_room_type))
      OR (c.room_type_id IS NOT NULL AND (ab.room_type_id=c.room_type_id OR blocked_room.room_type_id=c.room_type_id)))
)
SELECT * FROM booking_rows UNION ALL SELECT * FROM block_rows;
$$;
REVOKE ALL ON FUNCTION public.get_external_calendar_export_events(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_external_calendar_export_events(TEXT) TO anon,authenticated,service_role;
