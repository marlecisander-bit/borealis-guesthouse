-- Run after 20260904_025_unified_rooms_inventory.sql. All fixtures are rolled back.
BEGIN;
DO $$
DECLARE
  prop UUID:=gen_random_uuid(); product UUID:=gen_random_uuid(); protected_unit UUID;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  INSERT INTO public.properties(id,name,slug,status,currency)
    VALUES(prop,'Unified rooms test','unified-room-test-'||substr(prop::TEXT,1,8),'published','EUR');
  INSERT INTO public.room_types(id,property_id,name,title,slug,description,capacity,beds,status,is_visible,adults,children,base_occupancy)
    VALUES(product,prop,'Inventory test room','Inventory test room','inventory-test-'||substr(product::TEXT,1,8),'Rollback-only fixture',2,1,'published',TRUE,2,0,1);

  PERFORM public.sync_room_inventory(product,1,NULL);
  IF (SELECT count(*) FROM public.rooms WHERE room_type_id=product AND status<>'archived')<>1 THEN
    RAISE EXCEPTION 'Default inventory_count=1 did not create one unit';
  END IF;

  PERFORM public.sync_room_inventory(product,3,NULL);
  IF public.available_room_count(prop,product,CURRENT_DATE+600,CURRENT_DATE+602)<>3 THEN
    RAISE EXCEPTION 'inventory_count=3 was not available to the central engine';
  END IF;

  SELECT id INTO protected_unit FROM public.rooms WHERE room_type_id=product AND status<>'archived' LIMIT 1;
  INSERT INTO public.availability_blocks(property_id,room_id,start_date,end_date,reason,status)
    VALUES(prop,protected_unit,CURRENT_DATE+600,CURRENT_DATE+601,'Protected unit test','published');
  PERFORM public.sync_room_inventory(product,1,NULL);
  IF (SELECT count(*) FROM public.rooms WHERE room_type_id=product AND status<>'archived')<>1
     OR NOT EXISTS(SELECT 1 FROM public.rooms WHERE id=protected_unit AND status<>'archived') THEN
    RAISE EXCEPTION 'Inventory reduction did not preserve the connected unit';
  END IF;

  RAISE NOTICE 'Unified room inventory scenarios passed: default, expansion, availability and safe reduction.';
END $$;
ROLLBACK;
