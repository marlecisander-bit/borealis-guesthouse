-- Complete the existing multi-product booking flow without introducing a
-- second cart or reservation model. Add-on selections remain booking_items.

ALTER TABLE public.booking_items
  ADD COLUMN IF NOT EXISTS currency CHAR(3),
  ADD COLUMN IF NOT EXISTS service_time TIME,
  ADD COLUMN IF NOT EXISTS item_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.booking_items DROP CONSTRAINT IF EXISTS booking_items_item_status_check;
ALTER TABLE public.booking_items ADD CONSTRAINT booking_items_item_status_check
  CHECK(item_status IN ('held','pending','confirmed','completed','cancelled'));

UPDATE public.booking_items item
SET currency=booking.currency
FROM public.bookings booking
WHERE booking.id=item.booking_id AND item.currency IS NULL;

CREATE INDEX IF NOT EXISTS booking_items_service_inventory_idx
  ON public.booking_items(property_id,item_type,item_id,service_date,service_time,item_status);

-- The original prototype allowed only one row per experience/day, which
-- prevented genuine morning/afternoon slots. Preserve uniqueness per slot.
ALTER TABLE public.experience_availability
  DROP CONSTRAINT IF EXISTS experience_availability_experience_id_available_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS experience_availability_slot_uidx
  ON public.experience_availability(experience_id,available_date,COALESCE(start_time,'00:00'::TIME));

-- The room hold function from migration 027 remains the room/inventory
-- authority. This wrapper calls it without add-ons, then validates and inserts
-- every experience/transfer inside the same PostgreSQL transaction.
CREATE OR REPLACE FUNCTION public.create_booking_package_hold(
  target_room_type UUID,
  stay_start DATE,
  stay_end DATE,
  guest_count INTEGER,
  guest_data JSONB,
  addon_data JSONB DEFAULT '[]'::JSONB
) RETURNS TABLE(booking_id UUID,hold_token UUID,reference TEXT,expires_at TIMESTAMPTZ,total NUMERIC,currency TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  room_hold RECORD; property_uuid UUID; booking_currency TEXT; addon JSONB;
  addon_uuid UUID; addon_type TEXT; addon_title TEXT; pricing_type TEXT;
  addon_currency TEXT; unit_amount NUMERIC; line_quantity INTEGER;
  requested_quantity INTEGER; requested_date DATE; requested_time TIME;
  availability_mode TEXT; maximum_capacity INTEGER; available_days SMALLINT[];
  window_start TIME; window_end TIME; slot_id UUID; slot_capacity INTEGER;
  already_reserved INTEGER; addons_total NUMERIC:=0; day_number SMALLINT;
BEGIN
  IF jsonb_typeof(COALESCE(addon_data,'[]'::JSONB))<>'array' THEN
    RAISE EXCEPTION 'Invalid add-on selection' USING ERRCODE='22023';
  END IF;
  IF EXISTS(
    SELECT 1 FROM jsonb_array_elements(addon_data) AS selected(value)
    GROUP BY selected.value->>'type',selected.value->>'id' HAVING count(*)>1
  ) THEN
    RAISE EXCEPTION 'The same add-on cannot be selected twice.' USING ERRCODE='22023';
  END IF;

  SELECT * INTO room_hold FROM public.create_booking_hold(
    target_room_type,stay_start,stay_end,guest_count,guest_data,'[]'::JSONB
  );
  SELECT b.property_id,b.currency INTO property_uuid,booking_currency
  FROM public.bookings b WHERE b.id=room_hold.booking_id;

  -- The room allocator already holds the property advisory transaction lock,
  -- so concurrent package bookings validate and reserve add-on capacity in a
  -- deterministic order as part of the same transaction.
  FOR addon IN SELECT value FROM jsonb_array_elements(addon_data) LOOP
    addon_type:=addon->>'type';
    BEGIN addon_uuid:=(addon->>'id')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid add-on selection' USING ERRCODE='22023';
    END;
    requested_quantity:=GREATEST(1,COALESCE(NULLIF(addon->>'quantity','')::INTEGER,guest_count));
    requested_date:=NULLIF(addon->>'date','')::DATE;
    requested_time:=NULLIF(addon->>'time','')::TIME;

    IF addon_type='experience' THEN
      SELECT e.name,e.pricing_type,e.currency,e.price,e.availability_mode,e.max_capacity
      INTO addon_title,pricing_type,addon_currency,unit_amount,availability_mode,maximum_capacity
      FROM public.experiences e
      WHERE e.id=addon_uuid AND e.property_id=property_uuid AND e.status='published'
        AND e.is_visible AND e.active AND e.bookable
      FOR SHARE;
      IF addon_title IS NULL THEN RAISE EXCEPTION 'This experience is no longer available. Please choose another option.' USING ERRCODE='22023'; END IF;
      IF requested_date IS NULL THEN requested_date:=stay_start; END IF;
      IF requested_date<stay_start OR requested_date>=stay_end THEN
        RAISE EXCEPTION 'Experience dates must fall within the stay.' USING ERRCODE='22023';
      END IF;
      IF maximum_capacity IS NOT NULL AND requested_quantity>maximum_capacity THEN
        RAISE EXCEPTION 'This experience cannot accommodate the selected participants.' USING ERRCODE='22023';
      END IF;

      slot_id:=NULL; slot_capacity:=NULL; day_number:=extract(dow FROM requested_date)::SMALLINT;
      IF availability_mode IN ('specific_dates','recurring') THEN
        SELECT ea.id,COALESCE(ea.slot_capacity,ea.max_bookings)
        INTO slot_id,slot_capacity
        FROM public.experience_availability ea
        WHERE ea.experience_id=addon_uuid AND ea.property_id=property_uuid
          AND ea.status='published' AND ea.active
          AND (
            (ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=requested_date)
            OR (ea.availability_type='recurring_day' AND ea.day_of_week=day_number)
          )
          AND (requested_time IS NULL OR ea.start_time IS NULL OR ea.start_time=requested_time)
        ORDER BY (ea.start_time IS NOT NULL) DESC,ea.start_time
        FOR UPDATE LIMIT 1;
        IF slot_id IS NULL THEN
          RAISE EXCEPTION 'This experience is not available on the selected date.' USING ERRCODE='22023';
        END IF;
        IF requested_time IS NULL THEN
          SELECT ea.start_time INTO requested_time FROM public.experience_availability ea WHERE ea.id=slot_id;
        END IF;
      END IF;

      IF slot_capacity IS NOT NULL THEN
        SELECT COALESCE(sum(COALESCE((item.metadata->>'requestedQuantity')::INTEGER,item.quantity)),0)::INTEGER INTO already_reserved
        FROM public.booking_items item JOIN public.bookings booking ON booking.id=item.booking_id
        WHERE item.item_type='experience' AND item.item_id=addon_uuid
          AND item.service_date=requested_date
          AND (requested_time IS NULL OR item.service_time IS NOT DISTINCT FROM requested_time)
          AND booking.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
          AND (booking.booking_status<>'held' OR booking.hold_expires_at>NOW());
        IF already_reserved+requested_quantity>slot_capacity THEN
          RAISE EXCEPTION 'This experience is no longer available at the selected time. Please choose another option.' USING ERRCODE='23P01';
        END IF;
      END IF;
      line_quantity:=CASE WHEN pricing_type='per_person' THEN requested_quantity ELSE 1 END;

    ELSIF addon_type='transfer' THEN
      SELECT t.title,t.price_type,t.currency,t.price,t.availability_mode,t.capacity,t.available_days,t.window_start,t.window_end
      INTO addon_title,pricing_type,addon_currency,unit_amount,availability_mode,maximum_capacity,available_days,window_start,window_end
      FROM public.transfer_routes t
      WHERE t.id=addon_uuid AND t.property_id=property_uuid AND t.status='published'
        AND t.is_visible AND t.active AND t.bookable
      FOR SHARE;
      IF addon_title IS NULL THEN RAISE EXCEPTION 'This transfer is no longer available. Please choose another option.' USING ERRCODE='22023'; END IF;
      IF requested_date IS NULL THEN requested_date:=stay_start; END IF;
      IF requested_date<stay_start OR requested_date>stay_end THEN
        RAISE EXCEPTION 'Transfer dates must match the arrival or departure window.' USING ERRCODE='22023';
      END IF;
      IF maximum_capacity IS NOT NULL AND requested_quantity>maximum_capacity THEN
        RAISE EXCEPTION 'This transfer cannot accommodate the selected passengers.' USING ERRCODE='22023';
      END IF;
      day_number:=extract(dow FROM requested_date)::SMALLINT;
      IF availability_mode='scheduled' AND cardinality(available_days)>0 AND NOT day_number=ANY(available_days) THEN
        RAISE EXCEPTION 'This transfer does not operate on the selected date.' USING ERRCODE='22023';
      END IF;
      IF requested_time IS NOT NULL AND ((window_start IS NOT NULL AND requested_time<window_start) OR (window_end IS NOT NULL AND requested_time>window_end)) THEN
        RAISE EXCEPTION 'The pickup time is outside this transfer schedule.' USING ERRCODE='22023';
      END IF;
      line_quantity:=CASE WHEN pricing_type='per_passenger' THEN requested_quantity ELSE 1 END;
    ELSE
      RAISE EXCEPTION 'Invalid add-on selection' USING ERRCODE='22023';
    END IF;

    IF addon_currency='ALL' OR (unit_amount IS NOT NULL AND addon_currency<>booking_currency) THEN
      RAISE EXCEPTION 'Add-on and room currencies do not match.' USING ERRCODE='22023';
    END IF;
    unit_amount:=COALESCE(unit_amount,0); addons_total:=addons_total+unit_amount*line_quantity;
    INSERT INTO public.booking_items(
      booking_id,property_id,item_type,item_id,title_snapshot,quantity,
      unit_price,total_price,currency,service_date,service_time,item_status,metadata
    ) VALUES(
      room_hold.booking_id,property_uuid,addon_type,addon_uuid,addon_title,line_quantity,
      unit_amount,unit_amount*line_quantity,booking_currency,requested_date,requested_time,'held',
      jsonb_build_object('requestedQuantity',requested_quantity,'pricingType',pricing_type)
    );
  END LOOP;

  UPDATE public.booking_items SET currency=booking_currency,item_status='held'
  WHERE booking_items.booking_id=room_hold.booking_id AND booking_items.item_type='room';
  UPDATE public.bookings
  SET addons_subtotal=addons_total,subtotal=room_subtotal+addons_total,
      total_amount=room_subtotal+addons_total,updated_at=NOW()
  WHERE public.bookings.id=room_hold.booking_id;
  RETURN QUERY SELECT room_hold.booking_id,room_hold.hold_token,room_hold.reference,
    room_hold.expires_at,room_hold.total+addons_total,booking_currency;
END $$;
REVOKE ALL ON FUNCTION public.create_booking_package_hold(UUID,DATE,DATE,INTEGER,JSONB,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_package_hold(UUID,DATE,DATE,INTEGER,JSONB,JSONB) TO anon,authenticated;

-- Keep item lifecycle aligned with the parent booking while retaining the
-- ability to introduce product-specific operations later.
CREATE OR REPLACE FUNCTION public.sync_booking_item_status() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  UPDATE public.booking_items SET item_status=CASE NEW.booking_status
    WHEN 'held' THEN 'held' WHEN 'cancelled' THEN 'cancelled'
    WHEN 'completed' THEN 'completed' WHEN 'pending' THEN 'pending'
    WHEN 'awaiting_payment' THEN 'pending' ELSE 'confirmed' END,
    updated_at=NOW()
  WHERE booking_id=NEW.id AND item_status<>CASE NEW.booking_status
    WHEN 'held' THEN 'held' WHEN 'cancelled' THEN 'cancelled'
    WHEN 'completed' THEN 'completed' WHEN 'pending' THEN 'pending'
    WHEN 'awaiting_payment' THEN 'pending' ELSE 'confirmed' END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_booking_item_status ON public.bookings;
CREATE TRIGGER sync_booking_item_status AFTER UPDATE OF booking_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_item_status();

CREATE OR REPLACE FUNCTION public.get_booking_confirmation_package(target_token UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'reference',b.reference,'status',b.booking_status,'paymentStatus',b.payment_status,
    'paymentMethod',b.payment_method,'guestName',trim(g.first_name||' '||g.last_name),
    'checkIn',b.check_in,'checkOut',b.check_out,'adults',b.adults,'children',b.children,
    'roomSubtotal',b.room_subtotal,'addonsSubtotal',b.addons_subtotal,
    'taxes',b.taxes_fees,'discount',b.discount_amount,'total',b.total_amount,'currency',b.currency,
    'items',COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'type',item.item_type,'title',item.title_snapshot,'quantity',item.quantity,
      'unitPrice',item.unit_price,'subtotal',item.total_price,'currency',COALESCE(item.currency,b.currency),
      'date',item.service_date,'time',item.service_time,'status',item.item_status,'metadata',item.metadata
    ) ORDER BY item.created_at,item.id) FROM public.booking_items item WHERE item.booking_id=b.id),'[]'::JSONB)
  )
  FROM public.bookings b JOIN public.booking_guests g ON g.booking_id=b.id AND g.is_primary
  WHERE b.public_token=target_token AND b.booking_status<>'held' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_booking_confirmation_package(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_confirmation_package(UUID) TO anon,authenticated;
