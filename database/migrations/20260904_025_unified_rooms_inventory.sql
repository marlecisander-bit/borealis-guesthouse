-- Unified owner-facing Rooms model.
-- room_types remain the guest-facing sellable products; rooms remain the
-- operational units used by booking locks, availability and channel sync.

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS inventory_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_inventory_count_check;
ALTER TABLE public.room_types
  ADD CONSTRAINT room_types_inventory_count_check CHECK (inventory_count BETWEEN 1 AND 100);

-- Preserve every existing unit and use its current count as initial inventory.
UPDATE public.room_types rt
SET inventory_count=GREATEST(1,(
  SELECT count(*)::INTEGER FROM public.rooms r
  WHERE r.room_type_id=rt.id AND r.status<>'archived'
));

-- Make existing products without inventory bookable without duplicating any
-- product, rate, media, amenity or SEO records.
INSERT INTO public.rooms(
  id,property_id,room_type_id,room_number,title,is_available,status,is_visible,
  active,availability_status,notes,created_by,updated_by
)
SELECT
  gen_random_uuid(),rt.property_id,rt.id,
  'AUTO-'||upper(substr(replace(rt.id::TEXT,'-',''),1,8))||'-1',
  rt.name||' / Unit 1',TRUE,rt.status,rt.is_visible,TRUE,'available',
  'Managed automatically from Rooms inventory.',rt.created_by,rt.updated_by
FROM public.room_types rt
WHERE rt.status<>'archived'
  AND NOT EXISTS(SELECT 1 FROM public.rooms r WHERE r.room_type_id=rt.id AND r.status<>'archived')
ON CONFLICT(property_id,room_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_room_inventory(
  target_room_type UUID,
  target_count INTEGER,
  actor UUID DEFAULT auth.uid()
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  product public.room_types%ROWTYPE;
  current_count INTEGER;
  remove_count INTEGER;
  removable_count INTEGER;
  next_number INTEGER;
  unit_id UUID;
BEGIN
  IF target_count IS NULL OR target_count<1 OR target_count>100 THEN
    RAISE EXCEPTION 'Inventory must be between 1 and 100' USING ERRCODE='22023';
  END IF;

  SELECT * INTO product FROM public.room_types WHERE id=target_room_type FOR UPDATE;
  IF product.id IS NULL THEN RAISE EXCEPTION 'Room not found' USING ERRCODE='P0002'; END IF;
  IF COALESCE(auth.jwt()->>'role','')<>'service_role'
     AND NOT public.can_manage_property(product.property_id,ARRAY['owner','manager','editor']::public.admin_role[]) THEN
    RAISE EXCEPTION 'Not authorized to manage this room' USING ERRCODE='42501';
  END IF;

  SELECT count(*)::INTEGER INTO current_count
  FROM public.rooms WHERE room_type_id=product.id AND status<>'archived';

  IF product.status<>'archived' AND current_count>target_count THEN
    remove_count:=current_count-target_count;
    SELECT count(*)::INTEGER INTO removable_count
    FROM public.rooms r
    WHERE r.room_type_id=product.id AND r.status<>'archived'
      AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id
        AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in'))
      AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.room_id=r.id AND ab.status<>'archived')
      AND NOT EXISTS(SELECT 1 FROM public.external_calendars ec WHERE ec.room_id=r.id);
    IF removable_count<remove_count THEN
      RAISE EXCEPTION 'Inventory cannot be reduced because % unit(s) are connected to bookings, blocks or channel calendars',remove_count-removable_count
        USING ERRCODE='55000';
    END IF;

    WITH retiring AS (
      SELECT r.id FROM public.rooms r
      WHERE r.room_type_id=product.id AND r.status<>'archived'
        AND NOT EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=r.id
          AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in'))
        AND NOT EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.room_id=r.id AND ab.status<>'archived')
        AND NOT EXISTS(SELECT 1 FROM public.external_calendars ec WHERE ec.room_id=r.id)
      ORDER BY (r.notes='Managed automatically from Rooms inventory.') DESC NULLS LAST,r.created_at DESC,r.id
      LIMIT remove_count
    )
    UPDATE public.rooms r SET status='archived',active=FALSE,is_available=FALSE,is_visible=FALSE,
      archived_at=NOW(),updated_by=actor
    FROM retiring WHERE r.id=retiring.id;
  ELSIF product.status<>'archived' AND current_count<target_count THEN
    SELECT COALESCE(max((regexp_match(room_number,'-([0-9]+)$'))[1]::INTEGER),0)+1
      INTO next_number
    FROM public.rooms WHERE room_type_id=product.id AND room_number ~ '-[0-9]+$';
    FOR ordinal IN current_count+1..target_count LOOP
      unit_id:=gen_random_uuid();
      INSERT INTO public.rooms(
        id,property_id,room_type_id,room_number,title,is_available,status,is_visible,
        active,availability_status,notes,created_by,updated_by,archived_at
      ) VALUES(
        unit_id,product.property_id,product.id,
        'AUTO-'||upper(substr(replace(unit_id::TEXT,'-',''),1,8))||'-'||next_number,
        product.name||' / Unit '||next_number,TRUE,product.status,product.is_visible,
        TRUE,'available','Managed automatically from Rooms inventory.',actor,actor,NULL
      );
      next_number:=next_number+1;
    END LOOP;
  END IF;

  UPDATE public.room_types SET inventory_count=target_count,updated_by=actor WHERE id=product.id;

  -- The product lifecycle controls all retained units. Archiving keeps their
  -- internal rows reusable so restoring a product never creates duplicates.
  UPDATE public.rooms SET
    status=CASE WHEN product.status='archived' THEN status ELSE product.status END,
    active=product.status<>'archived',
    is_available=product.status<>'archived' AND availability_status='available',
    is_visible=product.is_visible AND product.status<>'archived',
    archived_at=NULL,
    updated_by=actor
  WHERE room_type_id=product.id AND status<>'archived';

  RETURN target_count;
END $$;

REVOKE ALL ON FUNCTION public.sync_room_inventory(UUID,INTEGER,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_room_inventory(UUID,INTEGER,UUID) TO authenticated;
