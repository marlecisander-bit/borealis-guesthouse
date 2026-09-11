-- Complete the direct-booking engine without introducing a second inventory,
-- pricing or reservation model. Run after 20260904_026_public_page_content_cms.sql.

CREATE TABLE IF NOT EXISTS public.booking_reference_counters (
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reference_year INTEGER NOT NULL,
  last_value INTEGER NOT NULL DEFAULT 0 CHECK(last_value>=0),
  PRIMARY KEY(property_id,reference_year)
);
ALTER TABLE public.booking_reference_counters ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addons_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

UPDATE public.bookings
SET room_subtotal=COALESCE(NULLIF(room_subtotal,0),subtotal,total_amount,0)
WHERE room_subtotal=0;

CREATE OR REPLACE FUNCTION public.next_booking_reference(target_property UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE target_year INTEGER:=extract(year FROM CURRENT_DATE)::INTEGER; sequence_value INTEGER;
BEGIN
  INSERT INTO public.booking_reference_counters(property_id,reference_year,last_value)
  VALUES(target_property,target_year,1)
  ON CONFLICT(property_id,reference_year) DO UPDATE
    SET last_value=booking_reference_counters.last_value+1
  RETURNING last_value INTO sequence_value;
  RETURN 'BRL-'||target_year::TEXT||'-'||lpad(sequence_value::TEXT,5,'0');
END $$;
REVOKE ALL ON FUNCTION public.next_booking_reference(UUID) FROM PUBLIC;

-- This is the single server-side pricing authority used by availability search,
-- public booking creation and manual Admin reservations.
CREATE OR REPLACE FUNCTION public.calculate_room_stay_price(
  target_property UUID,
  target_room_type UUID,
  stay_start DATE,
  stay_end DATE,
  guest_count INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  target_room public.room_types%ROWTYPE; base_amount NUMERIC; target_currency TEXT;
  day DATE; nightly NUMERIC; nightly_currency TEXT; seasonal_count INTEGER; weekend_count INTEGER; extra_currency TEXT; discount_currency TEXT;
  nightly_rows JSONB:='[]'::jsonb; gross NUMERIC:=0; extra_fee NUMERIC:=0;
  minimum_nights INTEGER; maximum_nights INTEGER; stay_nights INTEGER;
  discount_count INTEGER; discount_percent NUMERIC; fixed_discount NUMERIC; discount_total NUMERIC:=0;
BEGIN
  SELECT * INTO target_room FROM public.room_types
  WHERE id=target_room_type AND property_id=target_property AND status='published' AND is_visible;
  IF target_room.id IS NULL THEN RAISE EXCEPTION 'Room is not bookable' USING ERRCODE='22023'; END IF;
  IF stay_start<CURRENT_DATE OR stay_end<=stay_start OR guest_count<1 OR guest_count>target_room.capacity THEN
    RAISE EXCEPTION 'Invalid stay dates or guest count' USING ERRCODE='22023';
  END IF;
  stay_nights:=stay_end-stay_start;

  SELECT r.base_price,r.currency INTO base_amount,target_currency
  FROM public.rates r
  WHERE r.property_id=target_property AND r.room_type_id=target_room_type
    AND r.status='published' AND r.is_visible AND r.active;
  IF base_amount IS NULL THEN RAISE EXCEPTION 'No active rate is configured' USING ERRCODE='22023'; END IF;
  IF target_currency='ALL' THEN RAISE EXCEPTION 'Choose a specific booking currency for this room' USING ERRCODE='22023'; END IF;

  SELECT max(pr.nights) FILTER(WHERE pr.rule_type='minimum_stay'),
         min(pr.nights) FILTER(WHERE pr.rule_type='maximum_stay')
  INTO minimum_nights,maximum_nights
  FROM public.pricing_rules pr
  WHERE pr.property_id=target_property AND pr.status='published' AND pr.active
    AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
    AND (pr.start_date IS NULL OR pr.start_date<stay_end)
    AND (pr.end_date IS NULL OR pr.end_date>=stay_start);
  IF minimum_nights IS NOT NULL AND stay_nights<minimum_nights THEN
    RAISE EXCEPTION 'This stay requires at least % nights',minimum_nights USING ERRCODE='22023';
  END IF;
  IF maximum_nights IS NOT NULL AND stay_nights>maximum_nights THEN
    RAISE EXCEPTION 'This stay allows at most % nights',maximum_nights USING ERRCODE='22023';
  END IF;
  IF EXISTS(SELECT 1 FROM public.pricing_rules pr WHERE pr.property_id=target_property
    AND pr.status='published' AND pr.active AND pr.rule_type='closed_to_arrival'
    AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
    AND (pr.start_date IS NULL OR pr.start_date<=stay_start) AND (pr.end_date IS NULL OR pr.end_date>=stay_start)) THEN
    RAISE EXCEPTION 'Arrival is closed on this date' USING ERRCODE='22023';
  END IF;
  IF EXISTS(SELECT 1 FROM public.pricing_rules pr WHERE pr.property_id=target_property
    AND pr.status='published' AND pr.active AND pr.rule_type='closed_to_departure'
    AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
    AND (pr.start_date IS NULL OR pr.start_date<=stay_end) AND (pr.end_date IS NULL OR pr.end_date>=stay_end)) THEN
    RAISE EXCEPTION 'Departure is closed on this date' USING ERRCODE='22023';
  END IF;

  FOR day IN SELECT generate_series(stay_start,stay_end-1,INTERVAL '1 day')::DATE LOOP
    nightly:=base_amount; nightly_currency:=target_currency;
    SELECT count(*),max(s.nightly_price),max(s.currency)
      INTO seasonal_count,nightly,nightly_currency
    FROM public.seasonal_rate_periods s
    JOIN public.seasonal_rate_room_types link ON link.period_id=s.id AND link.room_type_id=target_room_type
    WHERE s.property_id=target_property AND s.status='published' AND s.active AND day BETWEEN s.start_date AND s.end_date;
    IF seasonal_count>1 THEN RAISE EXCEPTION 'Conflicting seasonal rates require review' USING ERRCODE='22023'; END IF;
    IF seasonal_count=0 THEN nightly:=base_amount; nightly_currency:=target_currency; END IF;

    SELECT count(*),max(pr.amount),max(COALESCE(pr.currency,target_currency))
      INTO weekend_count,nightly,nightly_currency
    FROM public.pricing_rules pr
    WHERE pr.property_id=target_property AND pr.status='published' AND pr.active AND pr.rule_type='weekend_price'
      AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
      AND (pr.start_date IS NULL OR pr.start_date<=day) AND (pr.end_date IS NULL OR pr.end_date>=day)
      AND ((pr.weekdays IS NULL AND extract(isodow FROM day)::INTEGER IN (5,6)) OR extract(isodow FROM day)::SMALLINT=ANY(pr.weekdays));
    IF weekend_count>1 THEN RAISE EXCEPTION 'Conflicting weekend rates require review' USING ERRCODE='22023'; END IF;
    IF weekend_count=0 THEN
      SELECT COALESCE(max(s.nightly_price),base_amount),COALESCE(max(s.currency),target_currency)
        INTO nightly,nightly_currency
      FROM public.seasonal_rate_periods s
      JOIN public.seasonal_rate_room_types link ON link.period_id=s.id AND link.room_type_id=target_room_type
      WHERE s.property_id=target_property AND s.status='published' AND s.active AND day BETWEEN s.start_date AND s.end_date;
    END IF;
    IF nightly_currency<>target_currency THEN
      RAISE EXCEPTION 'A stay cannot combine rates in different currencies' USING ERRCODE='22023';
    END IF;
    SELECT COALESCE(sum(pr.amount),0),max(COALESCE(pr.currency,target_currency)) INTO extra_fee,extra_currency FROM public.pricing_rules pr
    WHERE pr.property_id=target_property AND pr.status='published' AND pr.active AND pr.rule_type='extra_guest_fee'
      AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
      AND (pr.start_date IS NULL OR pr.start_date<=day) AND (pr.end_date IS NULL OR pr.end_date>=day);
    IF extra_fee>0 AND extra_currency<>target_currency THEN RAISE EXCEPTION 'Extra-guest fee currency does not match the room rate' USING ERRCODE='22023'; END IF;
    nightly:=nightly+extra_fee*GREATEST(0,guest_count-target_room.base_occupancy);
    gross:=gross+nightly;
    nightly_rows:=nightly_rows||jsonb_build_array(jsonb_build_object(
      'date',day,'amount',nightly,'currency',target_currency,
      'source',CASE WHEN weekend_count=1 THEN 'weekend' WHEN seasonal_count=1 THEN 'seasonal' ELSE 'base' END
    ));
  END LOOP;

  SELECT count(*),max(pr.percentage),max(pr.amount),max(COALESCE(pr.currency,target_currency)) INTO discount_count,discount_percent,fixed_discount,discount_currency
  FROM public.pricing_rules pr
  WHERE pr.property_id=target_property AND pr.status='published' AND pr.active
    AND pr.rule_type IN ('discount_percentage','fixed_discount')
    AND (pr.room_type_id IS NULL OR pr.room_type_id=target_room_type)
    AND (pr.start_date IS NULL OR pr.start_date<stay_end) AND (pr.end_date IS NULL OR pr.end_date>=stay_start);
  IF discount_count>1 THEN RAISE EXCEPTION 'Conflicting discounts require review' USING ERRCODE='22023'; END IF;
  IF fixed_discount IS NOT NULL AND discount_currency<>target_currency THEN RAISE EXCEPTION 'Discount currency does not match the room rate' USING ERRCODE='22023'; END IF;
  discount_total:=LEAST(gross,COALESCE(fixed_discount,gross*COALESCE(discount_percent,0)/100,0));
  RETURN jsonb_build_object(
    'roomTypeId',target_room_type,'checkIn',stay_start,'checkOut',stay_end,'nights',stay_nights,
    'nightlyRates',nightly_rows,'grossRoomSubtotal',round(gross,2),'discount',round(discount_total,2),
    'roomSubtotal',round(gross-discount_total,2),'currency',target_currency,'minimumStay',minimum_nights
  );
END $$;
REVOKE ALL ON FUNCTION public.calculate_room_stay_price(UUID,UUID,DATE,DATE,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_room_stay_price(UUID,UUID,DATE,DATE,INTEGER) TO anon,authenticated;

-- Replace hold creation so search and final creation use the same price function,
-- booking settings are enforced, and client-submitted totals remain irrelevant.
CREATE OR REPLACE FUNCTION public.create_booking_hold(target_room_type UUID,stay_start DATE,stay_end DATE,guest_count INTEGER,guest_data JSONB,addon_data JSONB DEFAULT '[]'::jsonb)
RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.properties%ROWTYPE; rt public.room_types%ROWTYPE; selected_room UUID; booking_uuid UUID:=gen_random_uuid(); token UUID:=gen_random_uuid(); ref TEXT;
 price JSONB; room_total NUMERIC; discount_total NUMERIC; addons_total NUMERIC:=0; cur TEXT; nights INTEGER; hold_minutes INTEGER:=15; minimum_notice INTEGER:=0; maximum_horizon INTEGER:=730;
 addon JSONB; addon_price NUMERIC; addon_title TEXT; addon_type TEXT; addon_pricing TEXT; addon_currency TEXT; addon_quantity INTEGER; addon_id UUID; adult_count INTEGER; child_count INTEGER;
BEGIN
 SELECT * INTO rt FROM public.room_types WHERE id=target_room_type AND status='published' AND is_visible FOR SHARE;
 SELECT * INTO p FROM public.properties WHERE id=rt.property_id AND status='published';
 adult_count:=COALESCE((guest_data->>'adults')::INTEGER,guest_count); child_count:=COALESCE((guest_data->>'children')::INTEGER,0);
 IF rt.id IS NULL OR guest_count<>adult_count+child_count OR adult_count<1 OR child_count<0
   OR trim(COALESCE(guest_data->>'firstName',''))='' OR trim(COALESCE(guest_data->>'lastName',''))=''
   OR trim(COALESCE(guest_data->>'phone',''))='' OR COALESCE(guest_data->>'email','')!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 THEN RAISE EXCEPTION 'Invalid stay or guest request' USING ERRCODE='22023'; END IF;
 SELECT COALESCE(max(value_number) FILTER(WHERE setting_key='booking_hold_minutes'),15)::INTEGER,
        COALESCE(max(value_number) FILTER(WHERE setting_key='minimum_advance_hours'),0)::INTEGER,
        COALESCE(max(value_number) FILTER(WHERE setting_key='maximum_booking_horizon_days'),730)::INTEGER
 INTO hold_minutes,minimum_notice,maximum_horizon FROM public.site_settings WHERE property_id=p.id;
 IF stay_start::TIMESTAMP < CURRENT_TIMESTAMP+make_interval(hours=>minimum_notice) OR stay_start>CURRENT_DATE+maximum_horizon THEN
   RAISE EXCEPTION 'Stay dates fall outside the configured booking window' USING ERRCODE='22023';
 END IF;
 price:=public.calculate_room_stay_price(p.id,rt.id,stay_start,stay_end,guest_count);
 room_total:=(price->>'roomSubtotal')::NUMERIC; discount_total:=(price->>'discount')::NUMERIC; cur:=price->>'currency'; nights:=(price->>'nights')::INTEGER;
 PERFORM public.expire_booking_holds(p.id);
 PERFORM pg_advisory_xact_lock(hashtext(p.id::TEXT));
 SELECT r.id INTO selected_room FROM public.rooms r WHERE r.property_id=p.id AND r.room_type_id=rt.id AND r.active AND r.status='published' AND r.availability_status='available'
  AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=p.id AND ab.status='published' AND (ab.room_id=r.id OR ab.room_type_id=r.room_type_id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
  AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND (rr.booking_status<>'held' OR rr.hold_expires_at>NOW()) AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)'))
 ORDER BY r.room_number,r.id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF selected_room IS NULL THEN RAISE EXCEPTION 'No room remains available for these dates' USING ERRCODE='23P01'; END IF;
 FOR addon IN SELECT * FROM jsonb_array_elements(COALESCE(addon_data,'[]'::jsonb)) LOOP
  addon_type:=addon->>'type'; addon_id:=(addon->>'id')::UUID; addon_price:=NULL; addon_title:=NULL; addon_pricing:=NULL; addon_currency:=NULL;
  IF addon_type='experience' THEN SELECT price,name,pricing_type,currency INTO addon_price,addon_title,addon_pricing,addon_currency FROM public.experiences WHERE id=addon_id AND property_id=p.id AND status='published' AND active AND bookable;
  ELSIF addon_type='transfer' THEN SELECT price,title,price_type,currency INTO addon_price,addon_title,addon_pricing,addon_currency FROM public.transfer_routes WHERE id=addon_id AND property_id=p.id AND status='published' AND active AND bookable; END IF;
  IF addon_title IS NULL THEN RAISE EXCEPTION 'An add-on is unavailable' USING ERRCODE='22023'; END IF;
  IF addon_price IS NOT NULL AND addon_currency<>cur THEN RAISE EXCEPTION 'Add-on and room currencies do not match' USING ERRCODE='22023'; END IF;
  addon_quantity:=CASE WHEN addon_pricing IN ('per_person','per_passenger') THEN guest_count ELSE 1 END; addons_total:=addons_total+COALESCE(addon_price,0)*addon_quantity;
 END LOOP;
 ref:=public.next_booking_reference(p.id);
 INSERT INTO public.bookings(id,property_id,check_in,check_out,status,booking_status,adults,children,subtotal,room_subtotal,addons_subtotal,discount_amount,taxes_fees,total_amount,currency,payment_status,payment_method,notes,source,reference,hold_expires_at,public_token)
 VALUES(booking_uuid,p.id,stay_start,stay_end,'pending','held',adult_count,child_count,room_total+addons_total,room_total,addons_total,discount_total,0,room_total+addons_total,cur,'pending','pay_at_property',NULLIF(guest_data->>'notes',''),'direct',ref,NOW()+make_interval(mins=>hold_minutes),token);
 INSERT INTO public.room_reservations(property_id,booking_id,room_id,check_in,check_out,booking_status,hold_expires_at) VALUES(p.id,booking_uuid,selected_room,stay_start,stay_end,'held',NOW()+make_interval(mins=>hold_minutes));
 INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,room_id,room_type_id,title_snapshot,quantity,unit_price,total_price,metadata)
 VALUES(booking_uuid,p.id,'room',selected_room,selected_room,rt.id,rt.name,nights,room_total/nights,room_total,jsonb_build_object('night_count',nights,'nightly_rates',price->'nightlyRates','discount',discount_total));
 FOR addon IN SELECT * FROM jsonb_array_elements(COALESCE(addon_data,'[]'::jsonb)) LOOP
  addon_type:=addon->>'type';addon_id:=(addon->>'id')::UUID;
  IF addon_type='experience' THEN SELECT COALESCE(price,0),name,pricing_type INTO addon_price,addon_title,addon_pricing FROM public.experiences WHERE id=addon_id;
  ELSE SELECT COALESCE(price,0),title,price_type INTO addon_price,addon_title,addon_pricing FROM public.transfer_routes WHERE id=addon_id; END IF;
  addon_quantity:=CASE WHEN addon_pricing IN ('per_person','per_passenger') THEN guest_count ELSE 1 END;
  INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,total_price) VALUES(booking_uuid,p.id,addon_type,addon_id,addon_title,addon_quantity,addon_price,addon_price*addon_quantity);
 END LOOP;
 INSERT INTO public.booking_guests(property_id,booking_id,first_name,last_name,email,phone,country,is_primary)
 VALUES(p.id,booking_uuid,trim(guest_data->>'firstName'),trim(guest_data->>'lastName'),lower(trim(guest_data->>'email')),trim(guest_data->>'phone'),NULLIF(trim(guest_data->>'country'),''),TRUE);
 RETURN QUERY SELECT booking_uuid,token,ref,(NOW()+make_interval(mins=>hold_minutes)),room_total+addons_total,cur;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_booking_hold(target_booking UUID,target_token UUID)
RETURNS TABLE(reference TEXT,status TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.bookings%ROWTYPE; booking_mode TEXT:='request'; next_status TEXT;
BEGIN
 SELECT COALESCE(max(s.value_text),'request') INTO booking_mode FROM public.site_settings s JOIN public.bookings b ON b.property_id=s.property_id
 WHERE b.id=target_booking AND s.setting_key='booking_mode';
 next_status:=CASE WHEN booking_mode='instant' THEN 'confirmed' ELSE 'pending' END;
 UPDATE public.bookings SET booking_status=next_status,status=next_status,hold_expires_at=NULL,updated_at=NOW()
 WHERE id=target_booking AND public_token=target_token AND booking_status='held' AND hold_expires_at>NOW() RETURNING * INTO result;
 IF result.id IS NULL THEN RAISE EXCEPTION 'The booking hold expired or is invalid' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT result.reference,next_status;
END $$;

CREATE OR REPLACE FUNCTION public.get_booking_confirmation(target_token UUID)
RETURNS TABLE(reference TEXT,status TEXT,payment_status TEXT,payment_method TEXT,guest_name TEXT,room_title TEXT,check_in DATE,check_out DATE,adults INTEGER,children INTEGER,total NUMERIC,currency TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT b.reference,b.booking_status,b.payment_status,b.payment_method,
   trim(g.first_name||' '||g.last_name),bi.title_snapshot,b.check_in,b.check_out,b.adults,b.children,b.total_amount,b.currency
 FROM public.bookings b
 JOIN public.booking_guests g ON g.booking_id=b.id AND g.is_primary
 JOIN public.booking_items bi ON bi.booking_id=b.id AND bi.item_type='room'
 WHERE b.public_token=target_token AND b.booking_status<>'held'
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_booking_confirmation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_confirmation(UUID) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_admin_booking(target_room_type UUID,stay_start DATE,stay_end DATE,adult_count INTEGER,child_count INTEGER,guest_data JSONB)
RETURNS TABLE(booking_id UUID,reference TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_property UUID; hold RECORD;
BEGIN
 SELECT property_id INTO target_property FROM public.room_types WHERE id=target_room_type;
 IF target_property IS NULL OR (COALESCE(auth.jwt()->>'role','')<>'service_role' AND NOT public.can_manage_property(target_property,ARRAY['owner','manager','staff']::public.admin_role[])) THEN
   RAISE EXCEPTION 'Not authorized to create this booking' USING ERRCODE='42501';
 END IF;
 SELECT * INTO hold FROM public.create_booking_hold(target_room_type,stay_start,stay_end,adult_count+child_count,
   guest_data||jsonb_build_object('adults',adult_count,'children',child_count),'[]'::jsonb);
 UPDATE public.bookings SET booking_status='confirmed',status='confirmed',source='admin',hold_expires_at=NULL,created_by=auth.uid(),updated_by=auth.uid()
 WHERE id=hold.booking_id;
 RETURN QUERY SELECT hold.booking_id,hold.reference;
END $$;
REVOKE ALL ON FUNCTION public.create_admin_booking(UUID,DATE,DATE,INTEGER,INTEGER,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_booking(UUID,DATE,DATE,INTEGER,INTEGER,JSONB) TO authenticated;

-- Manual and imported blocks use the same property lock as booking creation.
-- Recheck reservations while holding it so a block and a final-room booking
-- cannot race each other between an application read and database write.
CREATE OR REPLACE FUNCTION public.guard_availability_block_reservations() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::TEXT));
  IF NEW.status='published' AND EXISTS(
    SELECT 1 FROM public.room_reservations rr
    JOIN public.rooms r ON r.id=rr.room_id
    WHERE rr.property_id=NEW.property_id
      AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
      AND (rr.booking_status<>'held' OR rr.hold_expires_at>NOW())
      AND (NEW.room_id=rr.room_id OR NEW.room_type_id=r.room_type_id)
      AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(NEW.start_date,NEW.end_date,'[]')
  ) THEN RAISE EXCEPTION 'Inventory has a booking or active hold during these dates' USING ERRCODE='23P01'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_availability_block_reservations ON public.availability_blocks;
CREATE TRIGGER guard_availability_block_reservations BEFORE INSERT OR UPDATE OF room_id,room_type_id,start_date,end_date,status
  ON public.availability_blocks FOR EACH ROW EXECUTE FUNCTION public.guard_availability_block_reservations();
