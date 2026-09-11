-- Run after 20260904_021_booking_management.sql against a configured staging database.
-- Every change is rolled back. The test creates its own isolated property and inventory.
BEGIN;
DO $$
DECLARE rt UUID:=gen_random_uuid(); prop UUID:=gen_random_uuid(); chosen UUID:=gen_random_uuid(); first_hold RECORD; reopened_hold RECORD; blocked BOOLEAN:=FALSE; doubled BOOLEAN:=FALSE; start_on DATE:=CURRENT_DATE+400; end_on DATE:=CURRENT_DATE+402;
BEGIN
 INSERT INTO public.properties(id,name,slug,status,currency) VALUES(prop,'Booking integration test','booking-test-'||substr(prop::text,1,8),'published','EUR');
 INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,status,is_visible,adults,children,base_occupancy)
 VALUES(rt,prop,'Integration test room','Integration test room','booking-test-room-'||substr(rt::text,1,8),'Rollback-only booking fixture',2,1,'published',TRUE,2,0,1);
 INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status)
 VALUES(chosen,prop,rt,'TEST-'||substr(chosen::text,1,8),'Integration test physical room',TRUE,'published',TRUE,TRUE,'available');
 INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active)
 VALUES(prop,rt,125,'EUR','Integration test base rate','published',TRUE,TRUE);
 SELECT * INTO first_hold FROM public.create_booking_hold(rt,start_on,end_on,1,'{"firstName":"Test","lastName":"Guest","email":"test@example.invalid","phone":"+355000000","adults":1,"children":0}'::jsonb,'[]'::jsonb);
 IF first_hold.booking_id IS NULL THEN RAISE EXCEPTION 'Available-room hold failed'; END IF;
 PERFORM * FROM public.confirm_booking_hold(first_hold.booking_id,first_hold.hold_token);
 BEGIN PERFORM * FROM public.create_booking_hold(rt,start_on,end_on,1,'{"firstName":"Second","lastName":"Guest","email":"second@example.invalid","phone":"+355000001","adults":1,"children":0}'::jsonb,'[]'::jsonb); EXCEPTION WHEN exclusion_violation THEN doubled:=TRUE; END;
 IF NOT doubled THEN RAISE EXCEPTION 'Concurrent/same-date second booking was not rejected'; END IF;
 UPDATE public.bookings SET booking_status='cancelled',status='cancelled' WHERE id=first_hold.booking_id;
 IF public.available_room_count(prop,rt,start_on,end_on)<>1 THEN RAISE EXCEPTION 'Cancelled booking did not reopen inventory'; END IF;
 INSERT INTO public.availability_blocks(property_id,room_id,start_date,end_date,reason,status) VALUES(prop,chosen,start_on,end_on-1,'Blocked-inventory test','published');
 BEGIN PERFORM * FROM public.create_booking_hold(rt,start_on,end_on,1,'{"firstName":"Blocked","lastName":"Guest","email":"blocked@example.invalid","phone":"+355000002","adults":1,"children":0}'::jsonb,'[]'::jsonb); EXCEPTION WHEN exclusion_violation THEN blocked:=TRUE; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Blocked inventory was bookable'; END IF;
 UPDATE public.availability_blocks SET status='archived' WHERE property_id=prop AND reason='Blocked-inventory test';
 SELECT * INTO reopened_hold FROM public.create_booking_hold(rt,start_on,end_on,1,'{"firstName":"Reopened","lastName":"Guest","email":"reopened@example.invalid","phone":"+355000003","adults":1,"children":0}'::jsonb,'[]'::jsonb);
 IF reopened_hold.booking_id IS NULL THEN RAISE EXCEPTION 'Inventory did not reopen after block removal'; END IF;
 RAISE NOTICE 'Booking scenarios passed: available, successful, double-booking rejection, blocked, cancelled and reopened.';
END $$;
ROLLBACK;
