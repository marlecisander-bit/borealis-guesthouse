-- Run after 20260904_023_ical_channel_sync.sql. All fixtures are rolled back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); rt UUID:=gen_random_uuid(); room UUID:=gen_random_uuid(); cal UUID:=gen_random_uuid();
  start_on DATE:=CURRENT_DATE+500; moved_on DATE:=CURRENT_DATE+510; token TEXT; hold RECORD;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency) VALUES(prop,'iCal integration test','ical-test-'||substr(prop::text,1,8),'published','EUR');
  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,status,is_visible,adults,children,base_occupancy)
    VALUES(rt,prop,'iCal test room','iCal test room','ical-room-'||substr(rt::text,1,8),'Rollback-only iCal fixture',2,1,'published',TRUE,2,0,1);
  INSERT INTO public.rooms(id,property_id,room_type_id,room_number,title,is_available,status,is_visible,active,availability_status)
    VALUES(room,prop,rt,'ICAL-'||substr(room::text,1,8),'iCal physical room',TRUE,'published',TRUE,TRUE,'available');
  INSERT INTO public.rates(property_id,room_type_id,base_price,currency,title,status,is_visible,active)
    VALUES(prop,rt,125,'EUR','iCal test rate','published',TRUE,TRUE);
  INSERT INTO public.external_calendars(id,property_id,room_id,provider,name,calendar_url,direction,enabled)
    VALUES(cal,prop,room,'booking_com','Test Booking.com feed','https://example.invalid/private-token.ics','both',TRUE)
    RETURNING export_token INTO token;

  PERFORM public.sync_external_calendar_events(cal,jsonb_build_array(jsonb_build_object('uid','external-1','start_date',start_on,'end_date',start_on+2,'summary','Reserved','status','active')));
  IF public.available_room_count(prop,rt,start_on,start_on+2)<>0 THEN RAISE EXCEPTION 'Imported event did not block availability'; END IF;
  PERFORM public.sync_external_calendar_events(cal,jsonb_build_array(jsonb_build_object('uid','external-1','start_date',start_on,'end_date',start_on+2,'summary','Reserved','status','active')));
  IF (SELECT count(*) FROM public.external_calendar_events WHERE external_calendar_id=cal)<>1 THEN RAISE EXCEPTION 'Idempotent import created a duplicate'; END IF;

  PERFORM public.sync_external_calendar_events(cal,jsonb_build_array(jsonb_build_object('uid','external-1','start_date',moved_on,'end_date',moved_on+2,'summary','Moved','status','active')));
  IF public.available_room_count(prop,rt,start_on,start_on+2)<>1 OR public.available_room_count(prop,rt,moved_on,moved_on+2)<>0 THEN RAISE EXCEPTION 'Date change did not reopen old dates and block new dates'; END IF;
  PERFORM public.sync_external_calendar_events(cal,'[]'::jsonb);
  IF public.available_room_count(prop,rt,moved_on,moved_on+2)<>1 THEN RAISE EXCEPTION 'Removed event did not restore availability'; END IF;

  SELECT * INTO hold FROM public.create_booking_hold(rt,start_on,start_on+2,1,'{"firstName":"Export","lastName":"Test","email":"export@example.invalid","phone":"+355000004","adults":1,"children":0}'::jsonb,'[]'::jsonb);
  UPDATE public.bookings SET booking_status='confirmed',status='confirmed' WHERE id=hold.booking_id;
  IF NOT EXISTS(SELECT 1 FROM public.get_external_calendar_export_events(token) e WHERE e.uid LIKE 'booking-%' AND e.start_date=start_on AND e.end_date=start_on+2) THEN RAISE EXCEPTION 'Confirmed direct booking missing from export rows'; END IF;
  RAISE NOTICE 'iCal scenarios passed: import, idempotence, changed dates, removal, availability and direct-booking export.';
END $$;
ROLLBACK;
