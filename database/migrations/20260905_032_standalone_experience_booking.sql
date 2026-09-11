-- Standalone experience bookings reuse bookings, booking_items and booking_guests.

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS book_independently BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS maximum_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS booking_cutoff_hours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_booking_quantity_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_booking_quantity_check CHECK(
  minimum_quantity > 0 AND (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity)
  AND booking_cutoff_hours >= 0
);

-- Stay dates describe accommodation only; service dates live on booking_items.
ALTER TABLE public.bookings ALTER COLUMN check_in DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN check_out DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.get_public_experience_slots(target_experience UUID, from_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(slot_id UUID,service_date DATE,start_time TIME,end_time TIME,remaining INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT ea.id,ea.available_date,ea.start_time,ea.end_time,
    GREATEST(0,COALESCE(ea.slot_capacity,ea.max_bookings,e.max_capacity,99)-COALESCE((
      SELECT sum(COALESCE((bi.metadata->>'requestedQuantity')::INTEGER,bi.quantity))
      FROM booking_items bi JOIN bookings b ON b.id=bi.booking_id
      WHERE bi.item_type='experience' AND bi.item_id=e.id AND bi.service_date=ea.available_date
        AND bi.service_time IS NOT DISTINCT FROM ea.start_time
        AND b.booking_status IN ('held','pending','awaiting_payment','confirmed')
        AND (b.booking_status<>'held' OR b.hold_expires_at>NOW())),0))::INTEGER
  FROM experience_availability ea JOIN experiences e ON e.id=ea.experience_id
  WHERE e.id=target_experience AND e.status='published' AND e.is_visible AND e.active AND e.bookable AND e.book_independently
    AND ea.status='published' AND ea.active AND ea.available_date>=GREATEST(from_date,CURRENT_DATE)
  ORDER BY ea.available_date,ea.start_time LIMIT 90;
$$;
REVOKE ALL ON FUNCTION public.get_public_experience_slots(UUID,DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_experience_slots(UUID,DATE) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_experience_booking_hold(target_experience UUID,target_slot UUID,participant_count INTEGER,guest_data JSONB)
RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e experiences%ROWTYPE; slot experience_availability%ROWTYPE; booking_uuid UUID:=gen_random_uuid(); token UUID:=gen_random_uuid(); ref TEXT; held INTEGER; capacity INTEGER; quantity INTEGER; amount NUMERIC; expiry TIMESTAMPTZ:=NOW()+INTERVAL '15 minutes';
BEGIN
  IF participant_count<1 OR trim(COALESCE(guest_data->>'firstName',''))='' OR trim(COALESCE(guest_data->>'lastName',''))=''
    OR trim(COALESCE(guest_data->>'phone',''))='' OR COALESCE(guest_data->>'email','')!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  THEN RAISE EXCEPTION 'Complete valid participant and guest details are required' USING ERRCODE='22023'; END IF;
  SELECT * INTO e FROM experiences WHERE id=target_experience AND status='published' AND is_visible AND active AND bookable AND book_independently FOR SHARE;
  SELECT * INTO slot FROM experience_availability WHERE id=target_slot AND experience_id=e.id AND status='published' AND active AND available_date>=CURRENT_DATE FOR UPDATE;
  IF e.id IS NULL OR slot.id IS NULL OR participant_count<e.minimum_quantity OR (e.maximum_quantity IS NOT NULL AND participant_count>e.maximum_quantity)
    OR slot.available_date+COALESCE(slot.start_time,'00:00'::TIME)<NOW()+make_interval(hours=>e.booking_cutoff_hours)
  THEN RAISE EXCEPTION 'This experience slot is unavailable' USING ERRCODE='22023'; END IF;
  capacity:=COALESCE(slot.slot_capacity,slot.max_bookings,e.max_capacity,99);
  SELECT COALESCE(sum(COALESCE((bi.metadata->>'requestedQuantity')::INTEGER,bi.quantity)),0)::INTEGER INTO held
  FROM booking_items bi JOIN bookings b ON b.id=bi.booking_id WHERE bi.item_type='experience' AND bi.item_id=e.id AND bi.service_date=slot.available_date AND bi.service_time IS NOT DISTINCT FROM slot.start_time AND b.booking_status IN ('held','pending','awaiting_payment','confirmed') AND (b.booking_status<>'held' OR b.hold_expires_at>NOW());
  IF held+participant_count>capacity THEN RAISE EXCEPTION 'This time slot no longer has enough places' USING ERRCODE='23P01'; END IF;
  quantity:=CASE WHEN e.pricing_type='per_person' THEN participant_count ELSE 1 END; amount:=COALESCE(e.price,0)*quantity; ref:=next_booking_reference(e.property_id);
  INSERT INTO bookings(id,property_id,check_in,check_out,status,booking_status,adults,children,subtotal,room_subtotal,addons_subtotal,taxes_fees,total_amount,currency,payment_status,payment_method,notes,source,reference,hold_expires_at,public_token)
  VALUES(booking_uuid,e.property_id,NULL,NULL,'pending','held',participant_count,0,amount,0,amount,0,amount,e.currency,'pending','pay_at_property',NULLIF(guest_data->>'notes',''),'direct',ref,expiry,token);
  INSERT INTO booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,total_price,currency,service_date,service_time,item_status,metadata)
  VALUES(booking_uuid,e.property_id,'experience',e.id,e.name,quantity,COALESCE(e.price,0),amount,e.currency,slot.available_date,slot.start_time,'held',jsonb_build_object('requestedQuantity',participant_count,'pricingType',e.pricing_type,'slotId',slot.id));
  INSERT INTO booking_guests(property_id,booking_id,first_name,last_name,email,phone,country,is_primary)
  VALUES(e.property_id,booking_uuid,trim(guest_data->>'firstName'),trim(guest_data->>'lastName'),lower(trim(guest_data->>'email')),trim(guest_data->>'phone'),NULLIF(trim(guest_data->>'country'),''),TRUE);
  RETURN QUERY SELECT booking_uuid,token,ref,expiry,amount,e.currency::TEXT;
END $$;
REVOKE ALL ON FUNCTION public.create_experience_booking_hold(UUID,UUID,INTEGER,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_experience_booking_hold(UUID,UUID,INTEGER,JSONB) TO anon,authenticated;
