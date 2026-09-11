-- Run after 20260905_030_booking_cancellation_release.sql. All fixtures roll back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); room_type UUID:=gen_random_uuid(); room UUID:=gen_random_uuid(); second_room UUID:=gen_random_uuid();
  experience UUID:=gen_random_uuid(); transfer UUID:=gen_random_uuid();
  starts DATE:=CURRENT_DATE+300; quote JSONB; first_hold RECORD; checkout_hold RECORD; manual RECORD;
  package_hold RECORD; overlap_rejected BOOLEAN:=FALSE; capacity_rejected BOOLEAN:=FALSE; addon_capacity_rejected BOOLEAN:=FALSE; confirmation_count INTEGER; package JSONB;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency,timezone) VALUES(prop,'Booking acceptance test','booking-acceptance-'||substr(prop::TEXT,1,8),'published','EUR','Europe/Tirane');
  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,base_occupancy,inventory_count,status,is_visible,adults,children)
    VALUES(room_type,prop,'Acceptance double','Acceptance double','acceptance-'||substr(room_type::TEXT,1,8),'Rollback-only fixture',3,1,2,1,'published',TRUE,3,0);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status)
    VALUES(room,prop,room_type,'ACCEPT-'||substr(room::TEXT,1,8),'Acceptance unit',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active)
    VALUES(prop,room_type,60,'EUR','Acceptance base rate','published',TRUE,TRUE);

  quote:=public.calculate_room_stay_price(prop,room_type,starts,starts+2,2);
  IF (quote->>'roomSubtotal')::NUMERIC<>120 OR (quote->>'nights')::INTEGER<>2 THEN RAISE EXCEPTION 'Two-night server price was not EUR 120'; END IF;
  BEGIN PERFORM public.calculate_room_stay_price(prop,room_type,starts,starts+2,4); EXCEPTION WHEN invalid_parameter_value THEN capacity_rejected:=TRUE; END;
  IF NOT capacity_rejected THEN RAISE EXCEPTION 'Capacity validation accepted four guests in a capacity-three room'; END IF;

  SELECT * INTO first_hold FROM public.create_booking_hold(room_type,starts,starts+2,2,
    '{"firstName":"Normal","lastName":"Guest","email":"normal@example.invalid","phone":"+355111111","adults":2,"children":0}'::JSONB,'[]'::JSONB);
  IF first_hold.reference !~ '^BRL-[0-9]{4}-[0-9]{5}$' OR first_hold.total<>120 THEN RAISE EXCEPTION 'Reference or authoritative total is invalid'; END IF;
  PERFORM * FROM public.confirm_booking_hold(first_hold.booking_id,first_hold.hold_token);
  IF public.available_room_count(prop,room_type,starts,starts+2)<>0 THEN RAISE EXCEPTION 'Created booking did not consume inventory'; END IF;
  BEGIN
    PERFORM * FROM public.create_booking_hold(room_type,starts,starts+2,1,
      '{"firstName":"Overlap","lastName":"Guest","email":"overlap@example.invalid","phone":"+355222222","adults":1,"children":0}'::JSONB,'[]'::JSONB);
  EXCEPTION WHEN exclusion_violation THEN overlap_rejected:=TRUE; END;
  IF NOT overlap_rejected THEN RAISE EXCEPTION 'Final inventory accepted an overlapping booking'; END IF;

  SELECT * INTO checkout_hold FROM public.create_booking_hold(room_type,starts+2,starts+4,1,
    '{"firstName":"Checkout","lastName":"Guest","email":"checkout@example.invalid","phone":"+355333333","adults":1,"children":0}'::JSONB,'[]'::JSONB);
  IF checkout_hold.booking_id IS NULL THEN RAISE EXCEPTION 'Checkout-day arrival was rejected'; END IF;
  UPDATE public.bookings SET booking_status='cancelled',status='cancelled' WHERE id=first_hold.booking_id;
  IF public.available_room_count(prop,room_type,starts,starts+2)<>1 THEN RAISE EXCEPTION 'Cancellation did not release inventory'; END IF;
  IF EXISTS(SELECT 1 FROM public.room_reservations WHERE booking_id=first_hold.booking_id AND booking_status<>'cancelled') THEN
    RAISE EXCEPTION 'Cancellation did not synchronize the allocated room reservation';
  END IF;
  IF EXISTS(SELECT 1 FROM public.booking_items WHERE booking_id=first_hold.booking_id AND item_status<>'cancelled') THEN
    RAISE EXCEPTION 'Cancellation did not synchronize the booking line items';
  END IF;

  SELECT * INTO manual FROM public.create_admin_booking(room_type,starts,starts+2,1,0,
    '{"firstName":"Manual","lastName":"Guest","email":"manual@example.invalid","phone":"+355444444"}'::JSONB);
  IF NOT EXISTS(SELECT 1 FROM public.bookings WHERE id=manual.booking_id AND source='admin' AND booking_status='confirmed' AND total_amount=120) THEN
    RAISE EXCEPTION 'Manual booking bypassed or failed the shared booking engine';
  END IF;
  SELECT count(*) INTO confirmation_count FROM public.get_booking_confirmation((SELECT public_token FROM public.bookings WHERE id=manual.booking_id));
  IF confirmation_count<>1 THEN RAISE EXCEPTION 'Refresh-safe public confirmation was not available'; END IF;

  -- Full-package acceptance: one booking, three normalized line items and one
  -- authoritative total. A second physical unit isolates the experience-slot
  -- concurrency assertion from room inventory.
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status)
    VALUES(second_room,prop,room_type,'ACCEPT-2-'||substr(second_room::TEXT,1,8),'Second acceptance unit',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.experiences(id,property_id,name,title,slug,description,price,currency,pricing_type,max_capacity,availability_mode,status,is_visible,active,bookable)
    VALUES(experience,prop,'Paddle test','Paddle test','paddle-'||substr(experience::TEXT,1,8),'Package fixture',30,'EUR','per_person',4,'specific_dates','published',TRUE,TRUE,TRUE);
  INSERT INTO public.experience_availability(experience_id,property_id,available_date,max_bookings,current_bookings,availability_type,slot_capacity,active,status)
    VALUES(experience,prop,starts+10,2,0,'time_slot',2,TRUE,'published');
  INSERT INTO public.transfer_routes(id,property_id,slug,title,origin,destination,description,capacity,price_type,price,currency,status,is_visible,active,bookable,availability_mode)
    VALUES(transfer,prop,'transfer-'||substr(transfer::TEXT,1,8),'Shkoder to Borealis','Shkoder','Borealis','Package fixture',4,'fixed_vehicle',50,'EUR','published',TRUE,TRUE,TRUE,'always');
  SELECT * INTO package_hold FROM public.create_booking_package_hold(room_type,starts+10,starts+12,2,
    '{"firstName":"Package","lastName":"Guest","email":"package@example.invalid","phone":"+355555555","adults":2,"children":0}'::JSONB,
    jsonb_build_array(
      jsonb_build_object('id',experience,'type','experience','date',starts+10,'quantity',2),
      jsonb_build_object('id',transfer,'type','transfer','date',starts+10,'time','10:00','quantity',2)
    ));
  IF package_hold.total<>230 OR (SELECT count(*) FROM public.booking_items WHERE booking_id=package_hold.booking_id)<>3 THEN
    RAISE EXCEPTION 'Full package did not persist one room, one experience, one transfer and EUR 230 total';
  END IF;
  PERFORM * FROM public.confirm_booking_hold(package_hold.booking_id,package_hold.hold_token);
  package:=public.get_booking_confirmation_package(package_hold.hold_token);
  IF jsonb_array_length(package->'items')<>3 OR (package->>'total')::NUMERIC<>230 THEN
    RAISE EXCEPTION 'Full package confirmation is incomplete';
  END IF;
  BEGIN
    PERFORM * FROM public.create_booking_package_hold(room_type,starts+10,starts+12,1,
      '{"firstName":"Slot","lastName":"Race","email":"slot@example.invalid","phone":"+355666666","adults":1,"children":0}'::JSONB,
      jsonb_build_array(jsonb_build_object('id',experience,'type','experience','date',starts+10,'quantity',1)));
  EXCEPTION WHEN exclusion_violation THEN addon_capacity_rejected:=TRUE; END;
  IF NOT addon_capacity_rejected THEN RAISE EXCEPTION 'Final experience slot was overbooked'; END IF;
  RAISE NOTICE 'Booking engine acceptance passed: room-only, full package, authoritative totals, item persistence, add-on capacity, overlap, checkout day, cancellation, manual booking and confirmation.';
END $$;
ROLLBACK;
