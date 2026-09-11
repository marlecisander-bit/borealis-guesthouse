-- Make EUR the default for newly created prices while preserving currencies
-- deliberately selected on existing records.
DO $$
DECLARE target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'properties','rates','bookings','experiences','transfers',
    'transfer_routes','seasonal_rate_periods','payments'
  ] LOOP
    IF EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND information_schema.columns.table_name=target_table AND column_name='currency'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN currency SET DEFAULT %L',target_table,'EUR');
    END IF;
  END LOOP;
END $$;

-- A booking total must never add nightly amounts expressed in different
-- currencies. The public pricing service performs the same check earlier, and
-- this trigger keeps direct RPC calls server-safe.
CREATE OR REPLACE FUNCTION public.guard_booking_item_currency() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE booking_row public.bookings%ROWTYPE; target_room_type UUID;
BEGIN
  IF NEW.item_type<>'room' THEN RETURN NEW; END IF;
  SELECT * INTO booking_row FROM public.bookings WHERE id=NEW.booking_id;
  target_room_type:=NEW.room_type_id;
  IF target_room_type IS NULL AND NEW.room_id IS NOT NULL THEN
    SELECT room_type_id INTO target_room_type FROM public.rooms WHERE id=NEW.room_id;
  END IF;
  IF EXISTS(
    SELECT 1 FROM public.seasonal_rate_periods period
    JOIN public.seasonal_rate_room_types link ON link.period_id=period.id AND link.room_type_id=target_room_type
    WHERE period.property_id=booking_row.property_id AND period.status='published' AND period.active
      AND period.start_date<booking_row.check_out AND period.end_date>=booking_row.check_in
      AND COALESCE(period.currency,booking_row.currency)<>booking_row.currency
  ) THEN
    RAISE EXCEPTION 'Seasonal and base rates use different currencies for this stay' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_booking_item_currency ON public.booking_items;
CREATE TRIGGER guard_booking_item_currency BEFORE INSERT OR UPDATE OF room_id,room_type_id,item_type
  ON public.booking_items FOR EACH ROW EXECUTE FUNCTION public.guard_booking_item_currency();
