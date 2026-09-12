-- Add an atomic multi-room entry point while preserving the established
-- single-room RPCs for older clients. Every requested unit is repriced and
-- assigned to physical inventory inside one database transaction.

CREATE OR REPLACE FUNCTION public.create_multi_room_booking_package_hold(
  room_data JSONB, stay_start DATE, stay_end DATE, guest_count INTEGER,
  guest_data JSONB, addon_data JSONB DEFAULT '[]'::JSONB
) RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  room_group JSONB; occupancy_value JSONB; room_type_uuid UUID; occupancy INTEGER;
  rt public.room_types%ROWTYPE; property_uuid UUID; expected_property UUID;
  assigned_guests INTEGER:=0; requested_rooms INTEGER:=0; first_room BOOLEAN:=TRUE;
  room_hold RECORD; selected_room UUID; price JSONB; line_total NUMERIC;
  room_total NUMERIC:=0; discount_total NUMERIC:=0; booking_currency TEXT;
  adult_count INTEGER; child_count INTEGER; adjusted_guest JSONB;
BEGIN
  IF jsonb_typeof(room_data)<>'array' OR jsonb_array_length(room_data)=0 THEN
    RAISE EXCEPTION 'Choose at least one room.' USING ERRCODE='22023';
  END IF;
  adult_count:=COALESCE((guest_data->>'adults')::INTEGER,guest_count);
  child_count:=COALESCE((guest_data->>'children')::INTEGER,0);
  IF guest_count<>adult_count+child_count OR adult_count<1 OR child_count<0 THEN
    RAISE EXCEPTION 'The room allocation must match the guest total.' USING ERRCODE='22023';
  END IF;

  -- Validate the complete request before creating anything.
  FOR room_group IN SELECT value FROM jsonb_array_elements(room_data) LOOP
    BEGIN room_type_uuid:=(room_group->>'roomTypeId')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid room selection.' USING ERRCODE='22023'; END;
    SELECT * INTO rt FROM public.room_types WHERE id=room_type_uuid AND status='published' AND is_visible FOR SHARE;
    IF rt.id IS NULL OR jsonb_typeof(room_group->'guestCounts')<>'array' OR jsonb_array_length(room_group->'guestCounts')=0 THEN
      RAISE EXCEPTION 'A selected room is no longer bookable.' USING ERRCODE='22023';
    END IF;
    IF expected_property IS NULL THEN expected_property:=rt.property_id;
    ELSIF expected_property<>rt.property_id THEN RAISE EXCEPTION 'Rooms must belong to the same property.' USING ERRCODE='22023'; END IF;
    FOR occupancy_value IN SELECT value FROM jsonb_array_elements(room_group->'guestCounts') LOOP
      occupancy:=(occupancy_value#>>'{}')::INTEGER;
      IF occupancy<1 OR occupancy>rt.capacity THEN RAISE EXCEPTION 'A room occupancy exceeds its capacity.' USING ERRCODE='22023'; END IF;
      assigned_guests:=assigned_guests+occupancy; requested_rooms:=requested_rooms+1;
    END LOOP;
  END LOOP;
  IF assigned_guests<>guest_count OR requested_rooms>guest_count THEN
    RAISE EXCEPTION 'The room allocation must match the guest total.' USING ERRCODE='22023';
  END IF;

  -- The existing package function supplies booking-window validation, add-on
  -- capacity checks, reference generation and the first physical-room lock.
  FOR room_group IN SELECT value FROM jsonb_array_elements(room_data) LOOP
    room_type_uuid:=(room_group->>'roomTypeId')::UUID;
    SELECT * INTO rt FROM public.room_types WHERE id=room_type_uuid;
    FOR occupancy_value IN SELECT value FROM jsonb_array_elements(room_group->'guestCounts') LOOP
      occupancy:=(occupancy_value#>>'{}')::INTEGER;
      price:=public.calculate_room_stay_price(rt.property_id,rt.id,stay_start,stay_end,occupancy);
      line_total:=(price->>'roomSubtotal')::NUMERIC;
      IF first_room THEN
        adjusted_guest:=guest_data||jsonb_build_object('adults',occupancy,'children',0);
        SELECT * INTO room_hold FROM public.create_booking_package_hold(rt.id,stay_start,stay_end,occupancy,adjusted_guest,addon_data);
        property_uuid:=rt.property_id; booking_currency:=room_hold.currency;
        room_total:=line_total; discount_total:=(price->>'discount')::NUMERIC;
        UPDATE public.booking_items SET quantity=1,unit_price=line_total,total_price=line_total,
          metadata=metadata||jsonb_build_object('requestedQuantity',1,'guestCount',occupancy,'capacity',rt.capacity)
        WHERE public.booking_items.booking_id=room_hold.booking_id AND item_type='room';
        first_room:=FALSE;
      ELSE
        IF price->>'currency'<>booking_currency THEN RAISE EXCEPTION 'Room currencies do not match.' USING ERRCODE='22023'; END IF;
        SELECT r.id INTO selected_room FROM public.rooms r
        WHERE r.property_id=property_uuid AND r.room_type_id=rt.id AND r.active
          AND r.status='published' AND r.availability_status='available'
          AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=property_uuid AND ab.status='published' AND (ab.room_id=r.id OR ab.room_type_id=r.room_type_id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
          AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND (rr.booking_status<>'held' OR rr.hold_expires_at>NOW()) AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)'))
        ORDER BY r.room_number,r.id FOR UPDATE SKIP LOCKED LIMIT 1;
        IF selected_room IS NULL THEN RAISE EXCEPTION 'No room remains available for these dates' USING ERRCODE='23P01'; END IF;
        INSERT INTO public.room_reservations(property_id,booking_id,room_id,check_in,check_out,booking_status,hold_expires_at)
        VALUES(property_uuid,room_hold.booking_id,selected_room,stay_start,stay_end,'held',room_hold.expires_at);
        INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,room_id,room_type_id,title_snapshot,quantity,unit_price,total_price,currency,item_status,metadata)
        VALUES(room_hold.booking_id,property_uuid,'room',selected_room,selected_room,rt.id,rt.name,1,line_total,line_total,booking_currency,'held',
          jsonb_build_object('requestedQuantity',1,'guestCount',occupancy,'capacity',rt.capacity,'night_count',(price->>'nights')::INTEGER,'nightly_rates',price->'nightlyRates','discount',(price->>'discount')::NUMERIC));
        room_total:=room_total+line_total; discount_total:=discount_total+(price->>'discount')::NUMERIC;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.bookings SET adults=adult_count,children=child_count,
    room_subtotal=room_total,subtotal=room_total+addons_subtotal,
    total_amount=room_total+addons_subtotal,discount_amount=discount_total,updated_at=NOW()
  WHERE id=room_hold.booking_id;
  RETURN QUERY SELECT room_hold.booking_id,room_hold.hold_token,room_hold.reference,
    room_hold.expires_at,room_total+(SELECT b.addons_subtotal FROM public.bookings b WHERE b.id=room_hold.booking_id),booking_currency;
END $$;

REVOKE ALL ON FUNCTION public.create_multi_room_booking_package_hold(JSONB,DATE,DATE,INTEGER,JSONB,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_multi_room_booking_package_hold(JSONB,DATE,DATE,INTEGER,JSONB,JSONB) TO anon,authenticated;

-- Normalize legacy room lines so readers never confuse their historical
-- night count in quantity with the number of rooms booked.
UPDATE public.booking_items SET metadata=metadata||jsonb_build_object('requestedQuantity',1)
WHERE item_type='room' AND NOT metadata?'requestedQuantity';
