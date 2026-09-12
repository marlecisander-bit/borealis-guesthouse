-- Run after 20260912_037_multi_room_booking.sql. All fixtures roll back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); family UUID:=gen_random_uuid(); triple UUID:=gen_random_uuid();
  family_unit UUID:=gen_random_uuid(); triple_one UUID:=gen_random_uuid(); triple_two UUID:=gen_random_uuid();
  starts DATE:=CURRENT_DATE+430; held RECORD; rejected BOOLEAN:=FALSE; before_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency,email) VALUES(prop,'Multi room test','multi-'||substr(prop::TEXT,1,8),'published','EUR','owner@example.invalid');
  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,base_occupancy,inventory_count,status,is_visible,adults,children) VALUES
    (family,prop,'Family','Family','family-'||substr(family::TEXT,1,8),'Fixture',5,5,2,1,'published',TRUE,5,0),
    (triple,prop,'Triple','Triple','triple-'||substr(triple::TEXT,1,8),'Fixture',3,3,2,2,'published',TRUE,3,0);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status) VALUES
    (family_unit,prop,family,'F-1','Family unit',TRUE,'published',TRUE,TRUE,'available'),
    (triple_one,prop,triple,'T-1','Triple one',TRUE,'published',TRUE,TRUE,'available'),
    (triple_two,prop,triple,'T-2','Triple two',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active) VALUES
    (prop,family,100,'EUR','Family rate','published',TRUE,TRUE),(prop,triple,70,'EUR','Triple rate','published',TRUE,TRUE);

  SELECT * INTO held FROM public.create_multi_room_booking_package_hold(
    jsonb_build_array(jsonb_build_object('roomTypeId',family,'guestCounts',jsonb_build_array(3)),jsonb_build_object('roomTypeId',triple,'guestCounts',jsonb_build_array(3))),
    starts,starts+2,6,'{"firstName":"Multi","lastName":"Guest","email":"multi@example.invalid","phone":"+355111","adults":4,"children":2}'::JSONB,'[]'::JSONB);
  IF (SELECT count(*) FROM public.booking_items WHERE booking_id=held.booking_id AND item_type='room')<>2
     OR (SELECT count(*) FROM public.room_reservations WHERE booking_id=held.booking_id)<>2 THEN
    RAISE EXCEPTION 'One booking did not reserve both physical rooms';
  END IF;
  IF (SELECT sum((metadata->>'guestCount')::INTEGER) FROM public.booking_items WHERE booking_id=held.booking_id AND item_type='room')<>6 THEN
    RAISE EXCEPTION 'Per-room occupancy does not match the party';
  END IF;
  IF (SELECT room_subtotal FROM public.bookings WHERE id=held.booking_id)<>340 THEN
    RAISE EXCEPTION 'Server-side multi-room pricing is incorrect';
  END IF;

  SELECT count(*) INTO before_count FROM public.bookings WHERE property_id=prop;
  BEGIN
    PERFORM * FROM public.create_multi_room_booking_package_hold(
      jsonb_build_array(jsonb_build_object('roomTypeId',family,'guestCounts',jsonb_build_array(5))),starts,starts+2,5,
      '{"firstName":"Race","lastName":"Guest","email":"race@example.invalid","phone":"+355222","adults":5,"children":0}'::JSONB,'[]'::JSONB);
  EXCEPTION WHEN exclusion_violation THEN rejected:=TRUE; END;
  IF NOT rejected OR (SELECT count(*) FROM public.bookings WHERE property_id=prop)<>before_count THEN
    RAISE EXCEPTION 'Insufficient inventory did not roll back atomically';
  END IF;

  UPDATE public.bookings SET booking_status='cancelled',status='cancelled' WHERE id=held.booking_id;
  IF public.available_room_count(prop,family,starts,starts+2)<>1 OR public.available_room_count(prop,triple,starts,starts+2)<>2 THEN
    RAISE EXCEPTION 'Cancellation did not release every room';
  END IF;
  RAISE NOTICE 'Multi-room booking passed: one reference, two room items, exact occupancy, server pricing, atomic failure and cancellation release.';
END $$;
ROLLBACK;
