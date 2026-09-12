-- Add explicit adult, child and infant occupancy rules without removing the
-- legacy capacity/adults/children columns used by older clients and reports.

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS max_adults INTEGER,
  ADD COLUMN IF NOT EXISTS max_children INTEGER,
  ADD COLUMN IF NOT EXISTS max_infants INTEGER,
  ADD COLUMN IF NOT EXISTS max_total_occupancy INTEGER,
  ADD COLUMN IF NOT EXISTS min_adults INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS infants_count_toward_capacity BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.room_types SET
  max_total_occupancy=COALESCE(max_total_occupancy,capacity),
  max_adults=COALESCE(max_adults,NULLIF(adults,0),capacity),
  max_children=COALESCE(max_children,children,0),
  -- Infants were not represented by the legacy schema. Defaulting to zero is
  -- restrictive and reviewable; it does not invent permission for every room.
  max_infants=COALESCE(max_infants,0),
  min_adults=COALESCE(min_adults,1),
  infants_count_toward_capacity=COALESCE(infants_count_toward_capacity,TRUE);

ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_occupancy_policy_check;
ALTER TABLE public.room_types ADD CONSTRAINT room_types_occupancy_policy_check CHECK(
  COALESCE(max_total_occupancy,capacity)>0
  AND COALESCE(max_adults,capacity)>=1
  AND COALESCE(max_children,capacity)>=0
  AND COALESCE(max_infants,0)>=0
  AND min_adults>=1
  AND min_adults<=COALESCE(max_adults,capacity)
  AND COALESCE(max_adults,capacity)<=COALESCE(max_total_occupancy,capacity)
  AND COALESCE(max_children,capacity)<=COALESCE(max_total_occupancy,capacity)
  AND (NOT infants_count_toward_capacity OR COALESCE(max_infants,0)<=COALESCE(max_total_occupancy,capacity))
);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS infants INTEGER,
  ADD COLUMN IF NOT EXISTS total_guests INTEGER;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_occupancy_counts_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_occupancy_counts_check CHECK(
  (infants IS NULL AND total_guests IS NULL)
  OR (infants IS NOT NULL AND total_guests IS NOT NULL
      AND adults>=1 AND children>=0 AND infants>=0
      AND total_guests=adults+children+infants)
);

INSERT INTO public.site_settings(property_id,setting_key,value_number,is_public,status)
SELECT p.id,seed.setting_key,seed.value_number,TRUE,'published'
FROM public.properties p CROSS JOIN (VALUES
  ('infant_max_age',2::NUMERIC),('child_max_age',12::NUMERIC),('minimum_booking_holder_age',18::NUMERIC)
) seed(setting_key,value_number)
ON CONFLICT(property_id,setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.validate_room_occupancy(
  target_room_type UUID,adult_count INTEGER,child_count INTEGER,infant_count INTEGER
) RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE rt public.room_types%ROWTYPE; counted INTEGER;
BEGIN
  SELECT * INTO rt FROM public.room_types WHERE id=target_room_type AND status='published' AND is_visible;
  IF rt.id IS NULL THEN RAISE EXCEPTION 'A selected room is no longer bookable.' USING ERRCODE='22023'; END IF;
  IF adult_count IS NULL OR child_count IS NULL OR infant_count IS NULL OR adult_count<1 OR child_count<0 OR infant_count<0 THEN
    RAISE EXCEPTION 'At least one adult is required for every occupied room.' USING ERRCODE='22023';
  END IF;
  counted:=adult_count+child_count+CASE WHEN COALESCE(rt.infants_count_toward_capacity,TRUE) THEN infant_count ELSE 0 END;
  IF adult_count<COALESCE(rt.min_adults,1) THEN RAISE EXCEPTION 'This room requires at least % adult(s).',COALESCE(rt.min_adults,1) USING ERRCODE='22023'; END IF;
  IF adult_count>COALESCE(rt.max_adults,rt.capacity) THEN RAISE EXCEPTION 'This room allows at most % adult(s).',COALESCE(rt.max_adults,rt.capacity) USING ERRCODE='22023'; END IF;
  IF child_count>COALESCE(rt.max_children,rt.capacity) THEN RAISE EXCEPTION 'This room allows at most % child(ren).',COALESCE(rt.max_children,rt.capacity) USING ERRCODE='22023'; END IF;
  IF infant_count>COALESCE(rt.max_infants,0) THEN RAISE EXCEPTION 'This room allows at most % infant(s).',COALESCE(rt.max_infants,0) USING ERRCODE='22023'; END IF;
  IF counted>COALESCE(rt.max_total_occupancy,rt.capacity) THEN RAISE EXCEPTION 'This room exceeds its maximum total occupancy.' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.validate_room_occupancy(UUID,INTEGER,INTEGER,INTEGER) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_multi_room_booking_package_hold(
  room_data JSONB,stay_start DATE,stay_end DATE,guest_count INTEGER,
  guest_data JSONB,addon_data JSONB DEFAULT '[]'::JSONB
) RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  room_group JSONB; allocation JSONB;room_type_uuid UUID;occupancy_adults INTEGER;occupancy_children INTEGER;occupancy_infants INTEGER;priced_count INTEGER;
  rt public.room_types%ROWTYPE;property_uuid UUID;expected_property UUID;assigned_adults INTEGER:=0;assigned_children INTEGER:=0;assigned_infants INTEGER:=0;requested_rooms INTEGER:=0;first_room BOOLEAN:=TRUE;
  room_hold RECORD;selected_room UUID;price JSONB;line_total NUMERIC;room_total NUMERIC:=0;discount_total NUMERIC:=0;booking_currency TEXT;
  adult_count INTEGER;child_count INTEGER;infant_count INTEGER;adjusted_guest JSONB;allocations JSONB;
BEGIN
  IF jsonb_typeof(room_data)<>'array' OR jsonb_array_length(room_data)=0 THEN RAISE EXCEPTION 'Choose at least one room.' USING ERRCODE='22023'; END IF;
  adult_count:=COALESCE((guest_data->>'adults')::INTEGER,guest_count);child_count:=COALESCE((guest_data->>'children')::INTEGER,0);infant_count:=COALESCE((guest_data->>'infants')::INTEGER,0);
  IF adult_count<1 OR child_count<0 OR infant_count<0 OR guest_count<>adult_count+child_count+infant_count THEN RAISE EXCEPTION 'At least one adult and a complete guest allocation are required.' USING ERRCODE='22023'; END IF;

  FOR room_group IN SELECT value FROM jsonb_array_elements(room_data) LOOP
    BEGIN room_type_uuid:=(room_group->>'roomTypeId')::UUID;EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid room selection.' USING ERRCODE='22023';END;
    SELECT * INTO rt FROM public.room_types WHERE id=room_type_uuid AND status='published' AND is_visible FOR SHARE;
    IF rt.id IS NULL THEN RAISE EXCEPTION 'A selected room is no longer bookable.' USING ERRCODE='22023'; END IF;
    IF expected_property IS NULL THEN expected_property:=rt.property_id;ELSIF expected_property<>rt.property_id THEN RAISE EXCEPTION 'Rooms must belong to the same property.' USING ERRCODE='22023';END IF;
    allocations:=room_group->'occupancies';
    IF jsonb_typeof(allocations)<>'array' THEN
      IF jsonb_typeof(room_group->'guestCounts')<>'array' THEN RAISE EXCEPTION 'Every room needs a guest allocation.' USING ERRCODE='22023'; END IF;
      SELECT COALESCE(jsonb_agg(jsonb_build_object('adults',(value#>>'{}')::INTEGER,'children',0,'infants',0)),'[]'::JSONB) INTO allocations FROM jsonb_array_elements(room_group->'guestCounts');
    END IF;
    IF jsonb_array_length(allocations)=0 THEN RAISE EXCEPTION 'Every room needs a guest allocation.' USING ERRCODE='22023'; END IF;
    FOR allocation IN SELECT value FROM jsonb_array_elements(allocations) LOOP
      occupancy_adults:=COALESCE((allocation->>'adults')::INTEGER,0);occupancy_children:=COALESCE((allocation->>'children')::INTEGER,0);occupancy_infants:=COALESCE((allocation->>'infants')::INTEGER,0);
      PERFORM public.validate_room_occupancy(room_type_uuid,occupancy_adults,occupancy_children,occupancy_infants);
      assigned_adults:=assigned_adults+occupancy_adults;assigned_children:=assigned_children+occupancy_children;assigned_infants:=assigned_infants+occupancy_infants;requested_rooms:=requested_rooms+1;
    END LOOP;
  END LOOP;
  IF assigned_adults<>adult_count OR assigned_children<>child_count OR assigned_infants<>infant_count OR requested_rooms>guest_count THEN RAISE EXCEPTION 'The room allocation must match the adult, child and infant totals.' USING ERRCODE='22023'; END IF;

  FOR room_group IN SELECT value FROM jsonb_array_elements(room_data) LOOP
    room_type_uuid:=(room_group->>'roomTypeId')::UUID;SELECT * INTO rt FROM public.room_types WHERE id=room_type_uuid;
    allocations:=room_group->'occupancies';
    IF jsonb_typeof(allocations)<>'array' THEN SELECT jsonb_agg(jsonb_build_object('adults',(value#>>'{}')::INTEGER,'children',0,'infants',0)) INTO allocations FROM jsonb_array_elements(room_group->'guestCounts');END IF;
    FOR allocation IN SELECT value FROM jsonb_array_elements(allocations) LOOP
      occupancy_adults:=(allocation->>'adults')::INTEGER;occupancy_children:=COALESCE((allocation->>'children')::INTEGER,0);occupancy_infants:=COALESCE((allocation->>'infants')::INTEGER,0);
      priced_count:=occupancy_adults+occupancy_children+CASE WHEN COALESCE(rt.infants_count_toward_capacity,TRUE) THEN occupancy_infants ELSE 0 END;
      price:=public.calculate_room_stay_price(rt.property_id,rt.id,stay_start,stay_end,priced_count);line_total:=(price->>'roomSubtotal')::NUMERIC;
      IF first_room THEN
        adjusted_guest:=guest_data||jsonb_build_object('adults',priced_count,'children',0);
        SELECT * INTO room_hold FROM public.create_booking_package_hold(rt.id,stay_start,stay_end,priced_count,adjusted_guest,addon_data);
        property_uuid:=rt.property_id;booking_currency:=room_hold.currency;room_total:=line_total;discount_total:=(price->>'discount')::NUMERIC;
        UPDATE public.booking_items SET quantity=1,unit_price=line_total,total_price=line_total,metadata=metadata||jsonb_build_object('requestedQuantity',1,'guestCount',occupancy_adults+occupancy_children+occupancy_infants,'capacity',COALESCE(rt.max_total_occupancy,rt.capacity),'occupancy',allocation) WHERE public.booking_items.booking_id=room_hold.booking_id AND item_type='room';
        first_room:=FALSE;
      ELSE
        IF price->>'currency'<>booking_currency THEN RAISE EXCEPTION 'Room currencies do not match.' USING ERRCODE='22023';END IF;
        SELECT r.id INTO selected_room FROM public.rooms r WHERE r.property_id=property_uuid AND r.room_type_id=rt.id AND r.active AND r.status='published' AND r.availability_status='available'
          AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=property_uuid AND ab.status='published' AND (ab.room_id=r.id OR ab.room_type_id=r.room_type_id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
          AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND (rr.booking_status<>'held' OR rr.hold_expires_at>NOW()) AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)'))
        ORDER BY r.room_number,r.id FOR UPDATE SKIP LOCKED LIMIT 1;
        IF selected_room IS NULL THEN RAISE EXCEPTION 'No room remains available for these dates' USING ERRCODE='23P01';END IF;
        INSERT INTO public.room_reservations(property_id,booking_id,room_id,check_in,check_out,booking_status,hold_expires_at) VALUES(property_uuid,room_hold.booking_id,selected_room,stay_start,stay_end,'held',room_hold.expires_at);
        INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,room_id,room_type_id,title_snapshot,quantity,unit_price,total_price,currency,item_status,metadata) VALUES(room_hold.booking_id,property_uuid,'room',selected_room,selected_room,rt.id,rt.name,1,line_total,line_total,booking_currency,'held',jsonb_build_object('requestedQuantity',1,'guestCount',occupancy_adults+occupancy_children+occupancy_infants,'capacity',COALESCE(rt.max_total_occupancy,rt.capacity),'occupancy',allocation,'night_count',(price->>'nights')::INTEGER,'nightly_rates',price->'nightlyRates','discount',(price->>'discount')::NUMERIC));
        room_total:=room_total+line_total;discount_total:=discount_total+(price->>'discount')::NUMERIC;
      END IF;
    END LOOP;
  END LOOP;
  UPDATE public.bookings SET adults=adult_count,children=child_count,infants=infant_count,total_guests=guest_count,room_subtotal=room_total,subtotal=room_total+addons_subtotal,total_amount=room_total+addons_subtotal,discount_amount=discount_total,updated_at=NOW() WHERE id=room_hold.booking_id;
  RETURN QUERY SELECT room_hold.booking_id,room_hold.hold_token,room_hold.reference,room_hold.expires_at,room_total+(SELECT b.addons_subtotal FROM public.bookings b WHERE b.id=room_hold.booking_id),booking_currency;
END $$;
REVOKE ALL ON FUNCTION public.create_multi_room_booking_package_hold(JSONB,DATE,DATE,INTEGER,JSONB,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_multi_room_booking_package_hold(JSONB,DATE,DATE,INTEGER,JSONB,JSONB) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.confirm_booking_hold(target_booking UUID,target_token UUID)
RETURNS TABLE(reference TEXT,status TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.bookings%ROWTYPE;booking_mode TEXT:='request';next_status TEXT;item RECORD;allocation JSONB;sum_adults INTEGER:=0;sum_children INTEGER:=0;sum_infants INTEGER:=0;
BEGIN
  SELECT * INTO result FROM public.bookings WHERE id=target_booking AND public_token=target_token AND booking_status='held' AND hold_expires_at>NOW() FOR UPDATE;
  IF result.id IS NULL THEN RAISE EXCEPTION 'The booking hold expired or is invalid' USING ERRCODE='22023';END IF;
  IF result.total_guests IS NOT NULL THEN
    IF result.adults<1 OR result.total_guests<>result.adults+result.children+result.infants THEN RAISE EXCEPTION 'At least one adult and valid guest totals are required.' USING ERRCODE='22023';END IF;
    FOR item IN SELECT room_id,room_type_id,metadata FROM public.booking_items WHERE booking_id=result.id AND item_type='room' LOOP
      allocation:=item.metadata->'occupancy';IF jsonb_typeof(allocation)<>'object' THEN RAISE EXCEPTION 'A room guest allocation is missing.' USING ERRCODE='22023';END IF;
      PERFORM public.validate_room_occupancy(item.room_type_id,(allocation->>'adults')::INTEGER,COALESCE((allocation->>'children')::INTEGER,0),COALESCE((allocation->>'infants')::INTEGER,0));
      IF NOT EXISTS(SELECT 1 FROM public.rooms r WHERE r.id=item.room_id AND r.room_type_id=item.room_type_id AND r.active AND r.status='published' AND r.availability_status='available')
         OR EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=result.property_id AND ab.status='published' AND (ab.room_id=item.room_id OR ab.room_type_id=item.room_type_id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(result.check_in,result.check_out,'[)')) THEN
        RAISE EXCEPTION 'A selected room is no longer available.' USING ERRCODE='23P01';
      END IF;
      sum_adults:=sum_adults+(allocation->>'adults')::INTEGER;sum_children:=sum_children+COALESCE((allocation->>'children')::INTEGER,0);sum_infants:=sum_infants+COALESCE((allocation->>'infants')::INTEGER,0);
    END LOOP;
    IF sum_adults<>result.adults OR sum_children<>result.children OR sum_infants<>result.infants THEN RAISE EXCEPTION 'Room allocations no longer match the booking party.' USING ERRCODE='22023';END IF;
  END IF;
  SELECT COALESCE(max(s.value_text),'request') INTO booking_mode FROM public.site_settings s WHERE s.property_id=result.property_id AND s.setting_key='booking_mode';next_status:=CASE WHEN booking_mode='instant' THEN 'confirmed' ELSE 'pending' END;
  UPDATE public.bookings SET booking_status=next_status,status=next_status,hold_expires_at=NULL,updated_at=NOW() WHERE id=result.id;
  RETURN QUERY SELECT result.reference,next_status;
END $$;

CREATE OR REPLACE FUNCTION public.get_booking_confirmation_package(target_token UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('reference',b.reference,'status',b.booking_status,'paymentStatus',b.payment_status,'paymentMethod',b.payment_method,'guestName',trim(g.first_name||' '||g.last_name),'checkIn',b.check_in,'checkOut',b.check_out,'adults',b.adults,'children',b.children,'infants',b.infants,'totalGuests',b.total_guests,'roomSubtotal',b.room_subtotal,'addonsSubtotal',b.addons_subtotal,'taxes',b.taxes_fees,'discount',b.discount_amount,'total',b.total_amount,'currency',b.currency,'items',COALESCE((SELECT jsonb_agg(jsonb_build_object('type',item.item_type,'title',item.title_snapshot,'quantity',item.quantity,'unitPrice',item.unit_price,'subtotal',item.total_price,'currency',COALESCE(item.currency,b.currency),'date',item.service_date,'time',item.service_time,'status',item.item_status,'metadata',item.metadata) ORDER BY item.created_at,item.id) FROM public.booking_items item WHERE item.booking_id=b.id),'[]'::JSONB))
  FROM public.bookings b JOIN public.booking_guests g ON g.booking_id=b.id AND g.is_primary WHERE b.public_token=target_token AND b.booking_status<>'held' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_booking_confirmation_package(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_confirmation_package(UUID) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_admin_booking(target_room_type UUID,stay_start DATE,stay_end DATE,adult_count INTEGER,child_count INTEGER,infant_count INTEGER,guest_data JSONB)
RETURNS TABLE(booking_id UUID,reference TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_property UUID;hold RECORD;
BEGIN
  SELECT property_id INTO target_property FROM public.room_types WHERE id=target_room_type;
  IF target_property IS NULL OR (COALESCE(auth.jwt()->>'role','')<>'service_role' AND NOT public.can_manage_property(target_property,ARRAY['owner','manager','staff']::public.admin_role[])) THEN RAISE EXCEPTION 'Not authorized to create this booking' USING ERRCODE='42501';END IF;
  SELECT * INTO hold FROM public.create_multi_room_booking_package_hold(jsonb_build_array(jsonb_build_object('roomTypeId',target_room_type,'occupancies',jsonb_build_array(jsonb_build_object('adults',adult_count,'children',child_count,'infants',infant_count)))),stay_start,stay_end,adult_count+child_count+infant_count,guest_data||jsonb_build_object('adults',adult_count,'children',child_count,'infants',infant_count),'[]'::JSONB);
  UPDATE public.bookings SET booking_status='confirmed',status='confirmed',source='admin',hold_expires_at=NULL,created_by=auth.uid(),updated_by=auth.uid() WHERE id=hold.booking_id;
  RETURN QUERY SELECT hold.booking_id,hold.reference;
END $$;
REVOKE ALL ON FUNCTION public.create_admin_booking(UUID,DATE,DATE,INTEGER,INTEGER,INTEGER,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_booking(UUID,DATE,DATE,INTEGER,INTEGER,INTEGER,JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_admin_booking(target_room_type UUID,stay_start DATE,stay_end DATE,adult_count INTEGER,child_count INTEGER,guest_data JSONB)
RETURNS TABLE(booking_id UUID,reference TEXT) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.create_admin_booking(target_room_type,stay_start,stay_end,adult_count,child_count,0,guest_data);
$$;
