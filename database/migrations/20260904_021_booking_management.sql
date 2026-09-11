-- Transactional booking inventory, holds and lifecycle.
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Required before a rerun can normalize booking_status from the legacy enum.
DROP TRIGGER IF EXISTS sync_booking_reservation_status ON public.bookings;
ALTER TABLE public.bookings ALTER COLUMN booking_status DROP DEFAULT;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='booking_status' AND data_type<>'text') THEN
    ALTER TABLE public.bookings ALTER COLUMN booking_status TYPE TEXT USING booking_status::TEXT;
  END IF;
END $$;
ALTER TABLE public.bookings ALTER COLUMN booking_status SET DEFAULT 'pending';
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_status_check CHECK(booking_status IN ('pending','held','awaiting_payment','confirmed','cancelled','checked_in','completed'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS internal_note TEXT;
ALTER TABLE public.bookings ALTER COLUMN public_token SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS bookings_public_token_uidx ON public.bookings(public_token);

CREATE TABLE IF NOT EXISTS public.room_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  booking_status TEXT NOT NULL CHECK(booking_status IN ('pending','held','awaiting_payment','confirmed','cancelled','checked_in','completed')),
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(check_out>check_in),
  UNIQUE(booking_id,room_id)
);
ALTER TABLE public.room_reservations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.room_reservations DROP CONSTRAINT IF EXISTS room_reservations_no_overlap;
ALTER TABLE public.room_reservations ADD CONSTRAINT room_reservations_no_overlap EXCLUDE USING gist
  (room_id WITH =, daterange(check_in,check_out,'[)') WITH &&)
  WHERE (booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in'));
CREATE INDEX IF NOT EXISTS room_reservations_booking_idx ON public.room_reservations(property_id,booking_id);

ALTER TABLE public.room_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS room_reservations_admin_read ON public.room_reservations;
CREATE POLICY room_reservations_admin_read ON public.room_reservations FOR SELECT TO authenticated
  USING(public.can_manage_availability(property_id));

CREATE OR REPLACE FUNCTION public.expire_booking_holds(target_property UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.bookings SET booking_status='cancelled',status='cancelled',updated_at=NOW()
  WHERE property_id=target_property AND booking_status='held' AND hold_expires_at<=NOW();
END $$;

CREATE OR REPLACE FUNCTION public.sync_booking_reservation_status() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.room_reservations SET booking_status=NEW.booking_status,hold_expires_at=NEW.hold_expires_at
  WHERE booking_id=NEW.id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_booking_reservation_status ON public.bookings;
CREATE TRIGGER sync_booking_reservation_status AFTER UPDATE OF booking_status,hold_expires_at ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_reservation_status();

CREATE OR REPLACE FUNCTION public.available_room_count(target_property UUID,target_room_type UUID,stay_start DATE,stay_end DATE)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT count(*)::INTEGER FROM public.rooms r
WHERE r.property_id=target_property AND r.room_type_id=target_room_type AND r.active
  AND r.status='published' AND r.availability_status='available' AND stay_end>stay_start
  AND NOT EXISTS (SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=target_property AND ab.status='published'
    AND (ab.room_id=r.id OR ab.room_type_id=r.room_type_id)
    AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
  AND NOT EXISTS (SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id
    AND rr.booking_status IN ('pending','awaiting_payment','confirmed','checked_in','held')
    AND (rr.booking_status<>'held' OR rr.hold_expires_at>NOW())
    AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)'));
$$;

CREATE OR REPLACE FUNCTION public.create_booking_hold(target_room_type UUID,stay_start DATE,stay_end DATE,guest_count INTEGER,guest_data JSONB,addon_data JSONB DEFAULT '[]'::jsonb)
RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.properties%ROWTYPE; rt public.room_types%ROWTYPE; selected_room UUID; booking_uuid UUID:=gen_random_uuid(); token UUID:=gen_random_uuid(); ref TEXT;
 nights INTEGER; min_stay INTEGER; room_total NUMERIC:=0; addons_total NUMERIC:=0; nightly NUMERIC; base NUMERIC; seasonal_count INTEGER; cur TEXT; day DATE; addon JSONB; addon_price NUMERIC; addon_title TEXT; addon_type TEXT; addon_pricing TEXT; addon_quantity INTEGER; addon_id UUID;
BEGIN
 SELECT * INTO rt FROM public.room_types WHERE id=target_room_type AND status='published' AND is_visible FOR SHARE;
 SELECT * INTO p FROM public.properties WHERE id=rt.property_id AND status='published';
 IF rt.id IS NULL OR stay_start<CURRENT_DATE OR stay_end<=stay_start OR guest_count<1 OR guest_count>rt.capacity OR trim(COALESCE(guest_data->>'firstName',''))='' OR trim(COALESCE(guest_data->>'lastName',''))='' OR COALESCE(guest_data->>'email','')!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Invalid stay or guest request' USING ERRCODE='22023'; END IF;
 nights:=stay_end-stay_start;
 SELECT max(pr.nights) INTO min_stay FROM public.pricing_rules pr WHERE pr.property_id=p.id AND pr.rule_type='minimum_stay' AND pr.status='published' AND pr.active AND (pr.room_type_id IS NULL OR pr.room_type_id=rt.id) AND (pr.start_date IS NULL OR pr.start_date<stay_end) AND (pr.end_date IS NULL OR pr.end_date>=stay_start);
 IF min_stay IS NOT NULL AND nights<min_stay THEN RAISE EXCEPTION 'This stay requires at least % nights',min_stay USING ERRCODE='22023'; END IF;
 PERFORM public.expire_booking_holds(p.id);
 SELECT r.id INTO selected_room FROM public.rooms r WHERE r.property_id=p.id AND r.room_type_id=rt.id AND r.active AND r.status='published' AND r.availability_status='available'
  AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=p.id AND ab.status='published' AND (ab.room_id=r.id OR ab.room_type_id=r.room_type_id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
  AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)'))
 ORDER BY r.room_number,r.id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF selected_room IS NULL THEN RAISE EXCEPTION 'No room remains available for these dates' USING ERRCODE='23P01'; END IF;
 SELECT rate.base_price,rate.currency INTO base,cur FROM public.rates rate WHERE rate.property_id=p.id AND rate.room_type_id=rt.id AND rate.status='published' AND rate.is_visible AND rate.active;
 IF base IS NULL THEN RAISE EXCEPTION 'No active rate is configured' USING ERRCODE='22023'; END IF;
 FOR day IN SELECT generate_series(stay_start,stay_end-1,INTERVAL '1 day')::date LOOP
  SELECT count(*),max(s.nightly_price) INTO seasonal_count,nightly FROM public.seasonal_rate_periods s JOIN public.seasonal_rate_room_types l ON l.period_id=s.id AND l.room_type_id=rt.id WHERE s.property_id=p.id AND s.status='published' AND s.active AND day BETWEEN s.start_date AND s.end_date;
  IF seasonal_count>1 THEN RAISE EXCEPTION 'Conflicting rates require review' USING ERRCODE='22023'; END IF;
  room_total:=room_total+COALESCE(nightly,base);
 END LOOP;
 FOR addon IN SELECT * FROM jsonb_array_elements(COALESCE(addon_data,'[]'::jsonb)) LOOP
  addon_type:=addon->>'type'; addon_id:=(addon->>'id')::uuid; addon_price:=NULL; addon_title:=NULL; addon_pricing:=NULL;
  IF addon_type='experience' THEN SELECT price,name,pricing_type INTO addon_price,addon_title,addon_pricing FROM public.experiences WHERE id=addon_id AND property_id=p.id AND status='published' AND active AND bookable;
  ELSIF addon_type='transfer' THEN SELECT price,title,price_type INTO addon_price,addon_title,addon_pricing FROM public.transfer_routes WHERE id=addon_id AND property_id=p.id AND status='published' AND active AND bookable; END IF;
  IF addon_title IS NULL THEN RAISE EXCEPTION 'An add-on is unavailable' USING ERRCODE='22023'; END IF; addon_quantity:=CASE WHEN addon_pricing IN ('per_person','per_passenger') THEN guest_count ELSE 1 END;addons_total:=addons_total+COALESCE(addon_price,0)*addon_quantity;
 END LOOP;
 ref:='BOR-'||to_char(NOW(),'YYMMDD')||'-'||upper(substr(replace(booking_uuid::text,'-',''),1,6));
 INSERT INTO public.bookings(id,property_id,check_in,check_out,status,booking_status,adults,subtotal,total_amount,currency,payment_status,notes,source,reference,hold_expires_at,public_token)
 VALUES(booking_uuid,p.id,stay_start,stay_end,'pending','held',guest_count,room_total+addons_total,room_total+addons_total,cur,'pending',NULLIF(guest_data->>'notes',''),'direct',ref,NOW()+INTERVAL '15 minutes',token);
 INSERT INTO public.room_reservations(property_id,booking_id,room_id,check_in,check_out,booking_status,hold_expires_at) VALUES(p.id,booking_uuid,selected_room,stay_start,stay_end,'held',NOW()+INTERVAL '15 minutes');
 INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,room_id,room_type_id,title_snapshot,quantity,unit_price,total_price,metadata)
 VALUES(booking_uuid,p.id,'room',selected_room,selected_room,rt.id,rt.name,nights,room_total/nights,room_total,jsonb_build_object('night_count',nights));
 FOR addon IN SELECT * FROM jsonb_array_elements(COALESCE(addon_data,'[]'::jsonb)) LOOP
  addon_type:=addon->>'type';addon_id:=(addon->>'id')::uuid;
  IF addon_type='experience' THEN SELECT COALESCE(price,0),name,pricing_type INTO addon_price,addon_title,addon_pricing FROM public.experiences WHERE id=addon_id;
  ELSE SELECT COALESCE(price,0),title,price_type INTO addon_price,addon_title,addon_pricing FROM public.transfer_routes WHERE id=addon_id; END IF;addon_quantity:=CASE WHEN addon_pricing IN ('per_person','per_passenger') THEN guest_count ELSE 1 END;
  INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,total_price) VALUES(booking_uuid,p.id,addon_type,addon_id,addon_title,addon_quantity,addon_price,addon_price*addon_quantity);
 END LOOP;
 INSERT INTO public.booking_guests(property_id,booking_id,first_name,last_name,email,phone,is_primary) VALUES(p.id,booking_uuid,trim(guest_data->>'firstName'),trim(guest_data->>'lastName'),lower(trim(guest_data->>'email')),NULLIF(trim(guest_data->>'phone'),''),TRUE);
 RETURN QUERY SELECT booking_uuid,token,ref,(NOW()+INTERVAL '15 minutes'),room_total+addons_total,cur;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_booking_hold(target_booking UUID,target_token UUID)
RETURNS TABLE(reference TEXT,status TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.bookings%ROWTYPE;
BEGIN
 UPDATE public.bookings SET booking_status='pending',status='pending',hold_expires_at=NULL,updated_at=NOW()
 WHERE id=target_booking AND public_token=target_token AND booking_status='held' AND hold_expires_at>NOW() RETURNING * INTO result;
 IF result.id IS NULL THEN RAISE EXCEPTION 'The booking hold expired or is invalid' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT result.reference,'pending'::TEXT;
END $$;

REVOKE ALL ON FUNCTION public.available_room_count(UUID,UUID,DATE,DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking_hold(UUID,DATE,DATE,INTEGER,JSONB,JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_booking_hold(UUID,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.available_room_count(UUID,UUID,DATE,DATE) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_hold(UUID,DATE,DATE,INTEGER,JSONB,JSONB) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking_hold(UUID,UUID) TO anon,authenticated;
