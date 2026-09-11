-- Run after 20260905_033_experience_schedule_and_capacity.sql. Fixtures roll back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); experience UUID:=gen_random_uuid(); room_type UUID:=gen_random_uuid();
  room_one UUID:=gen_random_uuid(); room_two UUID:=gen_random_uuid(); service_day DATE:=CURRENT_DATE+400;
  standalone RECORD; package RECORD; remaining_count INTEGER; rejected BOOLEAN:=FALSE;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency,timezone,email)
    VALUES(prop,'Standalone experience test','standalone-'||substr(prop::TEXT,1,8),'published','EUR','Europe/Tirane','owner@example.invalid');
  INSERT INTO public.experiences(id,property_id,name,title,slug,description,short_description,full_description,price,currency,pricing_type,max_capacity,availability_mode,status,is_visible,active,bookable,book_independently,minimum_quantity,maximum_quantity,operating_days,operating_start_time,operating_end_time,slot_interval_minutes)
    VALUES(experience,prop,'Paddle Rental','Paddle Rental','paddle-'||substr(experience::TEXT,1,8),'Paddle fixture','Paddle fixture','Paddle fixture',15,'EUR','per_person',4,'always','published',TRUE,TRUE,TRUE,TRUE,1,4,ARRAY[0,1,2,3,4,5,6]::SMALLINT[],'09:00','18:00',60);

  IF NOT EXISTS(SELECT 1 FROM public.get_public_experience_slots(experience,service_day) WHERE service_date=service_day AND start_time='10:00' AND remaining=4) THEN
    RAISE EXCEPTION 'Operating schedule did not expose the 10:00 slot';
  END IF;
  SELECT * INTO standalone FROM public.create_experience_booking_hold(experience,service_day,'10:00',2,
    '{"firstName":"Mario","lastName":"Rossi","email":"mario@example.invalid","phone":"+355111"}'::JSONB);
  IF standalone.total<>30 OR standalone.reference !~ '^BRL-[0-9]{4}-[0-9]{5}$' THEN RAISE EXCEPTION 'Standalone price or reference is invalid'; END IF;
  IF (SELECT count(*) FROM public.booking_items WHERE booking_id=standalone.booking_id)<>1
     OR EXISTS(SELECT 1 FROM public.booking_items WHERE booking_id=standalone.booking_id AND item_type='room') THEN
    RAISE EXCEPTION 'Standalone booking did not persist exactly one Experience item';
  END IF;
  PERFORM * FROM public.confirm_booking_hold(standalone.booking_id,standalone.hold_token);

  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,base_occupancy,inventory_count,status,is_visible,adults,children)
    VALUES(room_type,prop,'Test room','Test room','room-'||substr(room_type::TEXT,1,8),'Room fixture',2,1,2,2,'published',TRUE,2,0);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status) VALUES
    (room_one,prop,room_type,'STAND-1','Unit 1',TRUE,'published',TRUE,TRUE,'available'),
    (room_two,prop,room_type,'STAND-2','Unit 2',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active)
    VALUES(prop,room_type,50,'EUR','Base rate','published',TRUE,TRUE);
  SELECT * INTO package FROM public.create_booking_package_hold(room_type,service_day,service_day+2,1,
    '{"firstName":"Room","lastName":"Guest","email":"room@example.invalid","phone":"+355222","adults":1,"children":0}'::JSONB,
    jsonb_build_array(jsonb_build_object('id',experience,'type','experience','date',service_day,'time','10:00','quantity',1)));
  PERFORM * FROM public.confirm_booking_hold(package.booking_id,package.hold_token);
  SELECT remaining INTO remaining_count FROM public.get_public_experience_slots(experience,service_day)
    WHERE service_date=service_day AND start_time='10:00';
  IF remaining_count<>1 THEN RAISE EXCEPTION 'Standalone and room add-on bookings do not share capacity'; END IF;

  BEGIN
    PERFORM * FROM public.create_booking_package_hold(room_type,service_day,service_day+2,1,
      '{"firstName":"Race","lastName":"Guest","email":"race@example.invalid","phone":"+355333","adults":1,"children":0}'::JSONB,
      jsonb_build_array(jsonb_build_object('id',experience,'type','experience','date',service_day,'time','10:00','quantity',2)));
  EXCEPTION WHEN exclusion_violation THEN rejected:=TRUE; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Shared capacity allowed overbooking'; END IF;

  UPDATE public.bookings SET booking_status='cancelled',status='cancelled' WHERE id=standalone.booking_id;
  SELECT remaining INTO remaining_count FROM public.get_public_experience_slots(experience,service_day)
    WHERE service_date=service_day AND start_time='10:00';
  IF remaining_count<>3 THEN RAISE EXCEPTION 'Cancellation did not release Experience capacity'; END IF;

  UPDATE public.experiences SET book_independently=FALSE WHERE id=experience;
  rejected:=FALSE;
  BEGIN
    PERFORM * FROM public.create_experience_booking_hold(experience,service_day,'11:00',1,
      '{"firstName":"Blocked","lastName":"Guest","email":"blocked@example.invalid","phone":"+355444"}'::JSONB);
  EXCEPTION WHEN invalid_parameter_value THEN rejected:=TRUE; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Disabled standalone booking was accepted'; END IF;
  RAISE NOTICE 'Standalone Experience booking passed: schedule, price, persistence, shared capacity, concurrency guard, cancellation and disabled route.';
END $$;
ROLLBACK;
