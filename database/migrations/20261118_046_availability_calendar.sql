BEGIN;

-- Serialize manual closures with booking allocation and calendar imports.
CREATE OR REPLACE FUNCTION public.guard_manual_availability_block()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target_type uuid;
BEGIN
  IF NEW.source <> 'manual' OR NEW.status <> 'published' THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));

  IF NEW.room_id IS NOT NULL THEN
    SELECT r.room_type_id INTO target_type FROM public.rooms r
    WHERE r.id=NEW.room_id AND r.property_id=NEW.property_id AND r.active AND r.status='published';
  ELSE
    SELECT t.id INTO target_type FROM public.room_types t
    WHERE t.id=NEW.room_type_id AND t.property_id=NEW.property_id AND t.status='published';
  END IF;
  IF target_type IS NULL THEN RAISE EXCEPTION 'Choose active room inventory' USING ERRCODE='22023'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.room_reservations r JOIN public.rooms unit ON unit.id=r.room_id
    WHERE r.property_id=NEW.property_id AND (r.room_id=NEW.room_id OR (NEW.room_id IS NULL AND unit.room_type_id=target_type))
      AND r.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
      AND (r.booking_status<>'held' OR r.hold_expires_at>now())
      AND r.check_in<=NEW.end_date AND r.check_out>NEW.start_date
  ) OR EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.booking_items i ON i.booking_id=b.id
    LEFT JOIN public.rooms unit ON unit.id=coalesce(i.room_id,CASE WHEN i.room_type_id IS NULL THEN i.item_id END)
    WHERE b.property_id=NEW.property_id AND i.item_type='room'
      AND b.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
      AND (b.booking_status<>'held' OR b.hold_expires_at>now())
      AND b.check_in<=NEW.end_date AND b.check_out>NEW.start_date
      AND (i.room_id=NEW.room_id OR (i.room_id IS NULL AND i.room_type_id IS NULL AND i.item_id=NEW.room_id)
        OR (i.room_type_id=target_type AND (NEW.room_id IS NULL OR i.room_id IS NULL))
        OR (NEW.room_id IS NULL AND unit.room_type_id=target_type))
  ) THEN RAISE EXCEPTION 'This inventory has a booking or active hold during the selected dates. Review it before blocking.' USING ERRCODE='23P01'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.availability_blocks b LEFT JOIN public.rooms unit ON unit.id=b.room_id
    WHERE b.property_id=NEW.property_id AND b.status='published' AND b.id<>NEW.id
      AND b.start_date<=NEW.end_date AND b.end_date>=NEW.start_date
      AND (b.room_id=NEW.room_id OR b.room_type_id=target_type OR (NEW.room_id IS NULL AND unit.room_type_id=target_type))
  ) THEN RAISE EXCEPTION 'An existing block already overlaps these dates.' USING ERRCODE='23P01'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_manual_availability_block() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_manual_availability_block ON public.availability_blocks;
CREATE TRIGGER guard_manual_availability_block BEFORE INSERT OR UPDATE OF start_date,end_date,status,room_id,room_type_id
ON public.availability_blocks FOR EACH ROW EXECUTE FUNCTION public.guard_manual_availability_block();

CREATE OR REPLACE FUNCTION public.admin_calendar_inventory(property uuid, first_day date, last_day date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT (public.can_manage_availability(property) OR public.team_has_permission(property,'availability.manage')) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
  IF first_day IS NULL AND last_day IS NULL THEN
    RETURN jsonb_build_object('timeZone',(SELECT p.timezone FROM public.properties p WHERE p.id=property));
  END IF;
  IF first_day IS NULL OR last_day IS NULL OR last_day-first_day NOT BETWEEN 0 AND 27 THEN
    RAISE EXCEPTION 'Choose a calendar range of up to 28 days' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object(
    'timeZone',(SELECT p.timezone FROM public.properties p WHERE p.id=property),
    'rooms',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'name',
      CASE WHEN r.title IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.rooms other WHERE other.property_id=property AND other.title=r.title AND other.id<>r.id AND other.status<>'archived') THEN r.title ELSE coalesce(nullif(r.title,''),t.name)||' · '||r.room_number END,
      'roomTypeId',r.room_type_id,'roomTypeName',t.name,'active',r.active AND r.status='published') ORDER BY r.room_number)
      FROM public.rooms r JOIN public.room_types t ON t.id=r.room_type_id
      WHERE r.property_id=property AND r.status<>'archived'),'[]'::jsonb),
    'blocks',coalesce((SELECT jsonb_agg(jsonb_build_object('id',b.id,'roomId',b.room_id,'roomTypeId',b.room_type_id,
      'targetName',coalesce(nullif(r.title,''),t.name,'Room'),'startDate',b.start_date,'endDate',b.end_date,'reasonCode',b.reason_code,
      'reason',CASE WHEN public.can_manage_availability(property) THEN coalesce(b.reason,'') ELSE '' END,'notes',CASE WHEN public.can_manage_availability(property) THEN coalesce(b.internal_notes,'') ELSE '' END,
      'source',b.source,'sourceName',c.name,'status',b.status) ORDER BY b.start_date)
      FROM public.availability_blocks b LEFT JOIN public.rooms r ON r.id=b.room_id
      LEFT JOIN public.room_types t ON t.id=coalesce(b.room_type_id,r.room_type_id)
      LEFT JOIN public.external_calendar_events e ON e.id=b.external_calendar_event_id
      LEFT JOIN public.external_calendars c ON c.id=e.external_calendar_id AND c.property_id=property
      WHERE b.property_id=property AND b.status='published' AND b.start_date<=last_day AND b.end_date>=first_day),'[]'::jsonb),
    'occupancy',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',b.id,'reference','','checkIn',b.check_in,'checkOut',b.check_out,'status',b.booking_status,'holdExpiresAt',b.hold_expires_at,
      'roomIds',ARRAY(SELECT DISTINCT room FROM (
        SELECT r.room_id AS room FROM public.room_reservations r WHERE r.booking_id=b.id
        UNION ALL
        SELECT coalesce(i.room_id, CASE WHEN i.room_type_id IS NULL THEN i.item_id END)
        FROM public.booking_items i WHERE i.booking_id=b.id AND i.item_type='room'
      ) assigned WHERE room IS NOT NULL),
      'roomTypeIds',ARRAY[]::uuid[],
      'unassignedTypeIds',ARRAY(SELECT i.room_type_id FROM public.booking_items i
        WHERE i.booking_id=b.id AND i.item_type='room' AND i.room_id IS NULL AND i.room_type_id IS NOT NULL)
    )) FROM public.bookings b WHERE b.property_id=property
      AND b.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
      AND (b.booking_status<>'held' OR b.hold_expires_at>now()) AND b.check_in<=last_day AND b.check_out>=first_day),'[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_calendar_change(property uuid, operation text, target uuid, payload jsonb DEFAULT '{}')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE legacy_allowed boolean; first_day date; last_day date;
BEGIN
  PERFORM 1 FROM public.admin_profiles p WHERE p.property_id=property AND p.user_id=auth.uid() AND p.is_active FOR SHARE;
  legacy_allowed:=public.can_manage_availability(property);
  IF NOT (legacy_allowed OR public.team_has_permission(property,'availability.manage')) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
  IF operation='reopen' THEN
    UPDATE public.availability_blocks SET status='archived',archived_at=now(),updated_by=auth.uid()
      WHERE property_id=property AND id=target AND source='manual' AND status='published';
    IF NOT FOUND THEN RAISE EXCEPTION 'Only an active manual block can be reopened' USING ERRCODE='22023'; END IF;
  ELSIF operation IN ('room','type') AND (legacy_allowed OR operation='room') THEN
    first_day:=(payload->>'startDate')::date;
    last_day:=(payload->>'endDate')::date;
    IF first_day IS NULL OR last_day IS NULL OR last_day-first_day NOT BETWEEN 0 AND 366
      OR length(coalesce(payload->>'reason',''))>300 OR length(coalesce(payload->>'notes',''))>2000
      OR coalesce(payload->>'reasonCode','') NOT IN ('maintenance','owner_use','other') THEN
      RAISE EXCEPTION 'Check the block dates and reason' USING ERRCODE='22023';
    END IF;
    INSERT INTO public.availability_blocks(property_id,room_id,room_type_id,start_date,end_date,source,status,reason_code,reason,internal_notes,created_by,updated_by)
      VALUES(property,CASE WHEN operation='room' THEN target END,CASE WHEN operation='type' THEN target END,
        first_day,last_day,'manual','published',payload->>'reasonCode',nullif(payload->>'reason',''),
        nullif(payload->>'notes',''),auth.uid(),auth.uid());
  ELSE
    RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_calendar_inventory(uuid,date,date), public.admin_calendar_change(uuid,text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_calendar_inventory(uuid,date,date), public.admin_calendar_change(uuid,text,uuid,jsonb) TO authenticated;
COMMIT;
