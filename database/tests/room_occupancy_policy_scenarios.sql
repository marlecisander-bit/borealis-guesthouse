-- Run after 20260912_038_room_occupancy_policy.sql. All fixtures roll back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); family UUID:=gen_random_uuid(); compact UUID:=gen_random_uuid();
  family_one UUID:=gen_random_uuid(); family_two UUID:=gen_random_uuid(); compact_one UUID:=gen_random_uuid();
  starts DATE:=CURRENT_DATE+440; held RECORD; rejected BOOLEAN:=FALSE;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency,email)
    VALUES(prop,'Occupancy policy test','occupancy-'||substr(prop::TEXT,1,8),'published','EUR','owner@example.invalid');
  INSERT INTO public.room_types(
    id,property_id,name,title,slug,description,capacity,beds,base_occupancy,inventory_count,status,is_visible,adults,children,
    max_adults,max_children,max_infants,max_total_occupancy,min_adults,infants_count_toward_capacity
  ) VALUES
    (family,prop,'Family policy room','Family policy room','family-'||substr(family::TEXT,1,8),'Fixture',4,2,2,2,'published',TRUE,2,0,2,3,1,4,1,TRUE),
    (compact,prop,'Compact policy room','Compact policy room','compact-'||substr(compact::TEXT,1,8),'Fixture',3,2,2,1,'published',TRUE,3,0,3,2,1,3,1,FALSE);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status) VALUES
    (family_one,prop,family,'OCC-F1','Family one',TRUE,'published',TRUE,TRUE,'available'),
    (family_two,prop,family,'OCC-F2','Family two',TRUE,'published',TRUE,TRUE,'available'),
    (compact_one,prop,compact,'OCC-C1','Compact one',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active) VALUES
    (prop,family,100,'EUR','Family rate','published',TRUE,TRUE),(prop,compact,80,'EUR','Compact rate','published',TRUE,TRUE);

  PERFORM public.validate_room_occupancy(family,1,2,1);
  PERFORM public.validate_room_occupancy(compact,2,1,1);
  BEGIN PERFORM public.validate_room_occupancy(family,0,2,0);EXCEPTION WHEN invalid_parameter_value THEN rejected:=TRUE;END;
  IF NOT rejected THEN RAISE EXCEPTION 'A room without an adult was accepted';END IF;
  rejected:=FALSE;
  BEGIN PERFORM public.validate_room_occupancy(family,1,4,0);EXCEPTION WHEN invalid_parameter_value THEN rejected:=TRUE;END;
  IF NOT rejected THEN RAISE EXCEPTION 'The child maximum was not enforced';END IF;
  rejected:=FALSE;
  BEGIN PERFORM public.validate_room_occupancy(family,2,2,1);EXCEPTION WHEN invalid_parameter_value THEN rejected:=TRUE;END;
  IF NOT rejected THEN RAISE EXCEPTION 'Infants that count toward capacity were ignored';END IF;

  SELECT * INTO held FROM public.create_multi_room_booking_package_hold(
    jsonb_build_array(jsonb_build_object('roomTypeId',family,'occupancies',jsonb_build_array(
      jsonb_build_object('adults',1,'children',2,'infants',0),
      jsonb_build_object('adults',1,'children',2,'infants',0)
    ))),starts,starts+2,6,
    '{"firstName":"Policy","lastName":"Guest","email":"policy@example.invalid","phone":"+355111","adults":2,"children":4,"infants":0}'::JSONB,'[]'::JSONB
  );
  IF (SELECT adults FROM public.bookings WHERE id=held.booking_id)<>2
     OR (SELECT children FROM public.bookings WHERE id=held.booking_id)<>4
     OR (SELECT infants FROM public.bookings WHERE id=held.booking_id)<>0
     OR (SELECT total_guests FROM public.bookings WHERE id=held.booking_id)<>6 THEN
    RAISE EXCEPTION 'Booking-level occupancy totals were not persisted';
  END IF;
  IF (SELECT count(*) FROM public.booking_items WHERE booking_id=held.booking_id AND item_type='room' AND metadata->'occupancy' IS NOT NULL)<>2 THEN
    RAISE EXCEPTION 'Per-room occupancy was not persisted';
  END IF;
  PERFORM * FROM public.confirm_booking_hold(held.booking_id,held.hold_token);

  rejected:=FALSE;
  BEGIN
    PERFORM * FROM public.create_multi_room_booking_package_hold(
      jsonb_build_array(jsonb_build_object('roomTypeId',family,'occupancies',jsonb_build_array(
        jsonb_build_object('adults',1,'children',2,'infants',0),jsonb_build_object('adults',0,'children',2,'infants',0)
      ))),starts+3,starts+5,5,
      '{"firstName":"Invalid","lastName":"Party","email":"invalid@example.invalid","phone":"+355222","adults":1,"children":4,"infants":0}'::JSONB,'[]'::JSONB
    );
  EXCEPTION WHEN invalid_parameter_value THEN rejected:=TRUE;END;
  IF NOT rejected THEN RAISE EXCEPTION 'One adult was incorrectly spread across two occupied rooms';END IF;

  RAISE NOTICE 'Occupancy policy passed: category maxima, adult-per-room, infant capacity, structured allocation, persistence and final confirmation.';
END $$;
ROLLBACK;
