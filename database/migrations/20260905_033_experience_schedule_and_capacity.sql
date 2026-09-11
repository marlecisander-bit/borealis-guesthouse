-- Complete the shared Experience availability engine. Standalone bookings,
-- room add-ons and future API clients all reserve the same booking_items pool.

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS operating_days SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::SMALLINT[],
  ADD COLUMN IF NOT EXISTS operating_start_time TIME,
  ADD COLUMN IF NOT EXISTS operating_end_time TIME,
  ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS active_date_start DATE,
  ADD COLUMN IF NOT EXISTS active_date_end DATE;

ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_operating_schedule_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_operating_schedule_check CHECK(
  operating_days <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]
  AND (operating_start_time IS NULL OR operating_end_time IS NULL OR operating_end_time > operating_start_time)
  AND (slot_interval_minutes IS NULL OR slot_interval_minutes BETWEEN 5 AND 1440)
  AND (active_date_start IS NULL OR active_date_end IS NULL OR active_date_end >= active_date_start)
);

-- One capacity guard is used regardless of which booking entry point inserts
-- the Experience item. The property lock serializes competing requests.
CREATE OR REPLACE FUNCTION public.guard_experience_booking_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  experience_row public.experiences%ROWTYPE;
  booking_row public.bookings%ROWTYPE;
  matched_slot public.experience_availability%ROWTYPE;
  requested_quantity INTEGER;
  reserved_quantity INTEGER;
  effective_capacity INTEGER;
  weekday SMALLINT;
  is_closed BOOLEAN;
BEGIN
  IF NEW.item_type<>'experience' OR NEW.item_status='cancelled' THEN RETURN NEW; END IF;
  SELECT * INTO experience_row FROM public.experiences WHERE id=NEW.item_id;
  SELECT * INTO booking_row FROM public.bookings WHERE id=NEW.booking_id;
  IF experience_row.id IS NULL OR booking_row.id IS NULL OR experience_row.property_id<>booking_row.property_id
     OR experience_row.status<>'published' OR NOT experience_row.active OR NOT experience_row.is_visible OR NOT experience_row.bookable
     OR NEW.service_date IS NULL THEN
    RAISE EXCEPTION 'This experience is not available' USING ERRCODE='22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(experience_row.property_id::TEXT));
  requested_quantity:=COALESCE(NULLIF(NEW.metadata->>'requestedQuantity','')::INTEGER,NEW.quantity);
  weekday:=extract(dow FROM NEW.service_date)::SMALLINT;
  IF requested_quantity<experience_row.minimum_quantity
     OR (experience_row.maximum_quantity IS NOT NULL AND requested_quantity>experience_row.maximum_quantity)
     OR (experience_row.max_capacity IS NOT NULL AND requested_quantity>experience_row.max_capacity)
     OR NEW.service_date<CURRENT_DATE
     OR (experience_row.active_date_start IS NOT NULL AND NEW.service_date<experience_row.active_date_start)
     OR (experience_row.active_date_end IS NOT NULL AND NEW.service_date>experience_row.active_date_end)
     OR NOT weekday=ANY(experience_row.operating_days) THEN
    RAISE EXCEPTION 'The selected date or quantity is not available' USING ERRCODE='22023';
  END IF;

  IF experience_row.operating_start_time IS NOT NULL
     AND (NEW.service_time IS NULL OR NEW.service_time<experience_row.operating_start_time) THEN
    RAISE EXCEPTION 'Choose a valid experience time' USING ERRCODE='22023';
  END IF;
  IF experience_row.operating_end_time IS NOT NULL
     AND (NEW.service_time IS NULL OR NEW.service_time>=experience_row.operating_end_time) THEN
    RAISE EXCEPTION 'Choose a valid experience time' USING ERRCODE='22023';
  END IF;
  IF experience_row.slot_interval_minutes IS NOT NULL AND NEW.service_time IS NULL THEN
    RAISE EXCEPTION 'Choose an experience time slot' USING ERRCODE='22023';
  END IF;
  IF experience_row.slot_interval_minutes IS NOT NULL AND experience_row.operating_start_time IS NOT NULL
     AND mod(extract(epoch FROM (NEW.service_time-experience_row.operating_start_time))::INTEGER,
       experience_row.slot_interval_minutes*60)<>0 THEN
    RAISE EXCEPTION 'Choose a published experience time slot' USING ERRCODE='22023';
  END IF;
  IF NEW.service_date+COALESCE(NEW.service_time,'23:59'::TIME)
     < NOW()+make_interval(hours=>experience_row.booking_cutoff_hours) THEN
    RAISE EXCEPTION 'The booking cutoff for this experience has passed' USING ERRCODE='22023';
  END IF;

  SELECT COALESCE(bool_or(COALESCE((ea.metadata->>'closed')::BOOLEAN,FALSE)),FALSE)
  INTO is_closed
  FROM public.experience_availability ea
  WHERE ea.experience_id=experience_row.id
    AND ((ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=NEW.service_date)
      OR (ea.availability_type='recurring_day' AND ea.day_of_week=weekday))
    AND (ea.start_time IS NULL OR ea.start_time IS NOT DISTINCT FROM NEW.service_time);
  IF is_closed THEN RAISE EXCEPTION 'This experience is closed at the selected time' USING ERRCODE='22023'; END IF;

  SELECT ea.* INTO matched_slot
  FROM public.experience_availability ea
  WHERE ea.experience_id=experience_row.id AND ea.status='published' AND ea.active
    AND NOT COALESCE((ea.metadata->>'closed')::BOOLEAN,FALSE)
    AND ((ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=NEW.service_date)
      OR (ea.availability_type='recurring_day' AND ea.day_of_week=weekday))
    AND (ea.start_time IS NULL OR ea.start_time IS NOT DISTINCT FROM NEW.service_time)
  ORDER BY (ea.available_date=NEW.service_date) DESC,(ea.start_time IS NOT NULL) DESC
  LIMIT 1;
  IF experience_row.availability_mode='specific_dates' AND matched_slot.id IS NULL THEN
    RAISE EXCEPTION 'This experience is not available on the selected date' USING ERRCODE='22023';
  END IF;

  effective_capacity:=COALESCE(matched_slot.slot_capacity,matched_slot.max_bookings,experience_row.max_capacity,99);
  SELECT COALESCE(sum(COALESCE(NULLIF(item.metadata->>'requestedQuantity','')::INTEGER,item.quantity)),0)::INTEGER
  INTO reserved_quantity
  FROM public.booking_items item
  JOIN public.bookings booking ON booking.id=item.booking_id
  WHERE item.item_type='experience' AND item.item_id=experience_row.id
    AND item.service_date=NEW.service_date
    AND item.service_time IS NOT DISTINCT FROM NEW.service_time
    AND item.id IS DISTINCT FROM NEW.id
    AND booking.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
    AND (booking.booking_status<>'held' OR booking.hold_expires_at>NOW());
  IF reserved_quantity+requested_quantity>effective_capacity THEN
    RAISE EXCEPTION 'This experience no longer has enough availability' USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_experience_booking_item ON public.booking_items;
CREATE TRIGGER guard_experience_booking_item
BEFORE INSERT OR UPDATE OF item_id,service_date,service_time,quantity,item_status,metadata
ON public.booking_items FOR EACH ROW EXECUTE FUNCTION public.guard_experience_booking_item();

-- Public availability combines explicit dated/recurring rows with the
-- Experience operating schedule. Returned capacity already includes holds.
CREATE OR REPLACE FUNCTION public.get_public_experience_slots(target_experience UUID,from_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(slot_id UUID,service_date DATE,start_time TIME,end_time TIME,remaining INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH product AS (
  SELECT * FROM public.experiences e WHERE e.id=target_experience AND e.status='published'
    AND e.is_visible AND e.active AND e.bookable AND e.book_independently
), days AS (
  SELECT day::DATE service_date FROM product p,
    generate_series(GREATEST(from_date,CURRENT_DATE)::TIMESTAMP,
      (GREATEST(from_date,CURRENT_DATE)+INTERVAL '89 days')::TIMESTAMP,INTERVAL '1 day') day
  WHERE (p.active_date_start IS NULL OR day::DATE>=p.active_date_start)
    AND (p.active_date_end IS NULL OR day::DATE<=p.active_date_end)
    AND extract(dow FROM day)::SMALLINT=ANY(p.operating_days)
), explicit_slots AS (
  SELECT ea.id slot_id,d.service_date,ea.start_time,ea.end_time
  FROM product p JOIN public.experience_availability ea ON ea.experience_id=p.id
  JOIN days d ON (ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=d.service_date)
    OR (ea.availability_type='recurring_day' AND ea.day_of_week=extract(dow FROM d.service_date)::SMALLINT)
  WHERE ea.status='published' AND ea.active AND NOT COALESCE((ea.metadata->>'closed')::BOOLEAN,FALSE)
), generated_slots AS (
  SELECT NULL::UUID slot_id,d.service_date,generated::TIME start_time,
    (generated+make_interval(mins=>p.slot_interval_minutes))::TIME end_time
  FROM product p JOIN days d ON p.availability_mode IN ('always','recurring')
  CROSS JOIN LATERAL generate_series(
    d.service_date+p.operating_start_time,
    d.service_date+p.operating_end_time-make_interval(mins=>p.slot_interval_minutes),
    make_interval(mins=>p.slot_interval_minutes)
  ) generated
  WHERE p.operating_start_time IS NOT NULL AND p.operating_end_time IS NOT NULL AND p.slot_interval_minutes IS NOT NULL
), flexible_slots AS (
  SELECT NULL::UUID slot_id,d.service_date,NULL::TIME start_time,NULL::TIME end_time
  FROM product p JOIN days d ON p.availability_mode IN ('always','recurring')
  WHERE p.operating_start_time IS NULL AND p.slot_interval_minutes IS NULL
), candidates AS (
  SELECT * FROM explicit_slots UNION ALL SELECT * FROM generated_slots UNION ALL SELECT * FROM flexible_slots
), unique_slots AS (
  SELECT service_date,start_time,(array_agg(slot_id) FILTER(WHERE slot_id IS NOT NULL))[1] slot_id,max(end_time) end_time FROM candidates
  GROUP BY service_date,start_time
), open_slots AS (
  SELECT u.*,p.id experience_id,p.max_capacity,p.booking_cutoff_hours,
    COALESCE((SELECT COALESCE(ea.slot_capacity,ea.max_bookings) FROM public.experience_availability ea
      WHERE ea.experience_id=p.id AND ea.status='published' AND ea.active
        AND ((ea.available_date=u.service_date AND ea.availability_type IN ('specific_date','time_slot'))
          OR (ea.availability_type='recurring_day' AND ea.day_of_week=extract(dow FROM u.service_date)::SMALLINT))
        AND (ea.start_time IS NULL OR ea.start_time IS NOT DISTINCT FROM u.start_time)
      ORDER BY (ea.available_date=u.service_date) DESC,(ea.start_time IS NOT NULL) DESC LIMIT 1),p.max_capacity,99) capacity
  FROM unique_slots u CROSS JOIN product p
  WHERE u.service_date+COALESCE(u.start_time,'23:59'::TIME)>=NOW()+make_interval(hours=>p.booking_cutoff_hours)
    AND NOT EXISTS(SELECT 1 FROM public.experience_availability closed
      WHERE closed.experience_id=p.id AND COALESCE((closed.metadata->>'closed')::BOOLEAN,FALSE)
        AND ((closed.available_date=u.service_date AND closed.availability_type IN ('specific_date','time_slot'))
          OR (closed.availability_type='recurring_day' AND closed.day_of_week=extract(dow FROM u.service_date)::SMALLINT))
        AND (closed.start_time IS NULL OR closed.start_time IS NOT DISTINCT FROM u.start_time))
)
SELECT o.slot_id,o.service_date,o.start_time,o.end_time,
  GREATEST(0,o.capacity-COALESCE((SELECT sum(COALESCE(NULLIF(item.metadata->>'requestedQuantity','')::INTEGER,item.quantity))
    FROM public.booking_items item JOIN public.bookings booking ON booking.id=item.booking_id
    WHERE item.item_type='experience' AND item.item_id=o.experience_id AND item.service_date=o.service_date
      AND item.service_time IS NOT DISTINCT FROM o.start_time
      AND booking.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
      AND (booking.booking_status<>'held' OR booking.hold_expires_at>NOW())),0))::INTEGER remaining
FROM open_slots o ORDER BY o.service_date,o.start_time LIMIT 1000;
$$;

REVOKE ALL ON FUNCTION public.get_public_experience_slots(UUID,DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_experience_slots(UUID,DATE) TO anon,authenticated;

DROP FUNCTION IF EXISTS public.create_experience_booking_hold(UUID,UUID,INTEGER,JSONB);
CREATE OR REPLACE FUNCTION public.create_experience_booking_hold(
  target_experience UUID,requested_date DATE,requested_time TIME,participant_count INTEGER,guest_data JSONB
) RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  e public.experiences%ROWTYPE; booking_uuid UUID:=gen_random_uuid(); token UUID:=gen_random_uuid();
  ref TEXT; line_quantity INTEGER; amount NUMERIC; expiry TIMESTAMPTZ:=NOW()+INTERVAL '15 minutes';
BEGIN
  IF participant_count<1 OR requested_date IS NULL OR trim(COALESCE(guest_data->>'firstName',''))=''
    OR trim(COALESCE(guest_data->>'lastName',''))='' OR trim(COALESCE(guest_data->>'phone',''))=''
    OR COALESCE(guest_data->>'email','')!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Complete valid experience and guest details are required' USING ERRCODE='22023';
  END IF;
  SELECT * INTO e FROM public.experiences WHERE id=target_experience AND status='published'
    AND is_visible AND active AND bookable AND book_independently FOR SHARE;
  IF e.id IS NULL THEN RAISE EXCEPTION 'This experience cannot be booked independently' USING ERRCODE='22023'; END IF;
  IF participant_count<e.minimum_quantity OR (e.maximum_quantity IS NOT NULL AND participant_count>e.maximum_quantity) THEN
    RAISE EXCEPTION 'Choose a valid quantity' USING ERRCODE='22023';
  END IF;
  line_quantity:=CASE WHEN e.pricing_type='per_person' THEN participant_count ELSE 1 END;
  amount:=COALESCE(e.price,0)*line_quantity; ref:=public.next_booking_reference(e.property_id);
  INSERT INTO public.bookings(id,property_id,check_in,check_out,status,booking_status,adults,children,
    subtotal,room_subtotal,addons_subtotal,taxes_fees,total_amount,currency,payment_status,payment_method,
    notes,source,reference,hold_expires_at,public_token)
  VALUES(booking_uuid,e.property_id,NULL,NULL,'pending','held',participant_count,0,amount,0,amount,0,amount,
    e.currency,'pending','pay_at_property',NULLIF(trim(guest_data->>'notes'),''),'direct',ref,expiry,token);
  INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,
    total_price,currency,service_date,service_time,item_status,metadata)
  VALUES(booking_uuid,e.property_id,'experience',e.id,e.name,line_quantity,COALESCE(e.price,0),amount,e.currency,
    requested_date,requested_time,'held',jsonb_build_object('requestedQuantity',participant_count,'pricingType',e.pricing_type));
  INSERT INTO public.booking_guests(property_id,booking_id,first_name,last_name,email,phone,country,is_primary)
  VALUES(e.property_id,booking_uuid,trim(guest_data->>'firstName'),trim(guest_data->>'lastName'),
    lower(trim(guest_data->>'email')),trim(guest_data->>'phone'),NULLIF(trim(guest_data->>'country'),''),TRUE);
  RETURN QUERY SELECT booking_uuid,token,ref,expiry,amount,e.currency::TEXT;
END $$;

REVOKE ALL ON FUNCTION public.create_experience_booking_hold(UUID,DATE,TIME,INTEGER,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_experience_booking_hold(UUID,DATE,TIME,INTEGER,JSONB) TO anon,authenticated;

-- Enrich the existing durable notification after its booking event row exists.
CREATE OR REPLACE FUNCTION public.enrich_experience_booking_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE event_type TEXT; item RECORD; guest_name TEXT;
BEGIN
  IF NEW.booking_status='cancelled' AND OLD.booking_status IS DISTINCT FROM 'cancelled' THEN event_type:='booking_cancelled';
  ELSIF OLD.booking_status='held' AND NEW.booking_status IN ('pending','awaiting_payment','confirmed') THEN event_type:='booking_created';
  ELSE RETURN NEW; END IF;
  IF EXISTS(SELECT 1 FROM public.booking_items WHERE booking_id=NEW.id AND item_type='room') THEN RETURN NEW; END IF;
  SELECT title_snapshot,service_date,service_time,COALESCE(NULLIF(metadata->>'requestedQuantity','')::INTEGER,quantity) quantity
  INTO item FROM public.booking_items WHERE booking_id=NEW.id AND item_type='experience' LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT trim(concat_ws(' ',first_name,last_name)) INTO guest_name FROM public.booking_guests
    WHERE booking_id=NEW.id ORDER BY is_primary DESC,created_at LIMIT 1;
  UPDATE public.notifications SET
    title=CASE event_type WHEN 'booking_created' THEN 'New experience booking' ELSE 'Experience booking cancelled' END,
    message=concat(COALESCE(NEW.reference,'Booking'),' · ',COALESCE(guest_name,'Guest'),' · ',item.title_snapshot,
      ' · ',to_char(item.service_date,'DD Mon YYYY'),CASE WHEN item.service_time IS NULL THEN '' ELSE ' · '||to_char(item.service_time,'HH24:MI') END,
      ' · ',item.quantity,' participant',CASE WHEN item.quantity=1 THEN '' ELSE 's' END),
    metadata=metadata||jsonb_build_object('bookingType','experience','experience',item.title_snapshot,
      'serviceDate',item.service_date,'serviceTime',item.service_time,'quantity',item.quantity),updated_at=NOW()
  WHERE booking_id=NEW.id AND type=event_type;
  -- Rebuild the visible message with ASCII separators so it remains safe when
  -- this migration is copied through SQL editors with different encodings.
  UPDATE public.notifications SET message=concat(
    COALESCE(NEW.reference,'Booking'),' / ',COALESCE(guest_name,'Guest'),' / ',item.title_snapshot,
    ' / ',to_char(item.service_date,'DD Mon YYYY'),
    CASE WHEN item.service_time IS NULL THEN '' ELSE ' / '||to_char(item.service_time,'HH24:MI') END,
    ' / ',item.quantity,' participant',CASE WHEN item.quantity=1 THEN '' ELSE 's' END
  ) WHERE booking_id=NEW.id AND type=event_type;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS zz_enrich_experience_booking_notification ON public.bookings;
CREATE TRIGGER zz_enrich_experience_booking_notification
AFTER UPDATE OF booking_status ON public.bookings FOR EACH ROW
EXECUTE FUNCTION public.enrich_experience_booking_notification();
