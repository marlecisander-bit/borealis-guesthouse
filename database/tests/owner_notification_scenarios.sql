-- Run after 20260905_031_owner_notifications.sql. All fixtures roll back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); room_type UUID:=gen_random_uuid(); room UUID:=gen_random_uuid(); held RECORD;
  starts DATE:=CURRENT_DATE+420; notification_count INTEGER; queue_diagnostic TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency,email)
    VALUES(prop,'Notification test','notification-'||substr(prop::TEXT,1,8),'published','EUR','owner@example.invalid');
  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,base_occupancy,inventory_count,status,is_visible,adults,children)
    VALUES(room_type,prop,'Notification room','Notification room','notify-'||substr(room_type::TEXT,1,8),'Rollback fixture',3,1,2,1,'published',TRUE,3,0);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status)
    VALUES(room,prop,room_type,'NOTIFY-1','Notification unit',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active)
    VALUES(prop,room_type,70,'EUR','Notification rate','published',TRUE,TRUE);
  INSERT INTO public.site_settings(property_id,setting_key,value_text,value_boolean,is_public,status)
  VALUES(prop,'booking_notification_email','owner@example.invalid',NULL,FALSE,'published')
  ON CONFLICT(property_id,setting_key) DO UPDATE SET value_text=EXCLUDED.value_text;

  SELECT * INTO held FROM public.create_booking_hold(room_type,starts,starts+2,2,
    '{"firstName":"Alert","lastName":"Guest","email":"guest@example.invalid","phone":"+355111","adults":2,"children":0}'::JSONB,'[]'::JSONB);
  IF EXISTS(SELECT 1 FROM public.notifications WHERE booking_id=held.booking_id) THEN
    RAISE EXCEPTION 'A temporary hold generated an owner notification';
  END IF;

  PERFORM * FROM public.confirm_booking_hold(held.booking_id,held.hold_token);
  SELECT count(*) INTO notification_count FROM public.notifications WHERE booking_id=held.booking_id AND type='booking_created';
  IF notification_count<>1 THEN RAISE EXCEPTION 'Confirmed booking did not generate exactly one notification'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.notification_deliveries d JOIN public.notifications n ON n.id=d.notification_id WHERE n.booking_id=held.booking_id AND d.status='pending') THEN
    SELECT metadata->>'emailQueueError' INTO queue_diagnostic
    FROM public.notifications WHERE booking_id=held.booking_id AND type='booking_created';
    RAISE EXCEPTION 'Email delivery was not queued for booking %. Trigger diagnostic: %',held.booking_id,COALESCE(queue_diagnostic,'no database error; inspect notification settings');
  END IF;

  UPDATE public.bookings SET booking_status='confirmed' WHERE id=held.booking_id;
  IF (SELECT count(*) FROM public.notifications WHERE booking_id=held.booking_id AND type='booking_created')<>1 THEN
    RAISE EXCEPTION 'Repeated confirmation generated a duplicate notification';
  END IF;

  UPDATE public.bookings SET booking_status='cancelled',status='cancelled' WHERE id=held.booking_id;
  IF (SELECT count(*) FROM public.notifications WHERE booking_id=held.booking_id AND type='booking_cancelled')<>1 THEN
    RAISE EXCEPTION 'Cancellation notification is missing';
  END IF;
  IF public.available_room_count(prop,room_type,starts,starts+2)<>1 THEN
    RAISE EXCEPTION 'Notification trigger interfered with cancellation availability release';
  END IF;
  RAISE NOTICE 'Owner notifications passed: post-hold creation, idempotence, delivery queue, cancellation and booking independence.';
END $$;
ROLLBACK;
