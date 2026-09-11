-- Run after 20260910_034_family_room_lake_view.sql.
DO $$
DECLARE
  product public.room_types%ROWTYPE;
  amenity_count INTEGER;
BEGIN
  IF (SELECT count(*) FROM public.room_types WHERE lower(slug)='family-room-lake-view' AND status<>'archived')<>1 THEN
    RAISE EXCEPTION 'Family Room is missing or duplicated';
  END IF;

  SELECT * INTO product FROM public.room_types
  WHERE lower(slug)='family-room-lake-view' AND status<>'archived';

  IF product.name<>'Family Room with Lake View' OR product.status<>'published'
     OR NOT product.is_visible OR product.capacity<>5 OR product.size_sqm<>45
     OR product.bed_configuration<>'4 single beds and 1 sofa bed'
     OR product.inventory_count<>1 THEN
    RAISE EXCEPTION 'Family Room core fields are incorrect';
  END IF;

  IF (SELECT count(*) FROM public.rooms WHERE room_type_id=product.id AND status<>'archived')<>1 THEN
    RAISE EXCEPTION 'Family Room must have exactly one operational unit';
  END IF;

  SELECT count(*) INTO amenity_count FROM public.room_type_amenities link
  JOIN public.amenities amenity ON amenity.id=link.amenity_id
  WHERE link.room_type_id=product.id;
  IF amenity_count<>32 THEN RAISE EXCEPTION 'Expected 32 normalized amenities, found %',amenity_count; END IF;

  IF EXISTS(SELECT 1 FROM public.room_images WHERE room_type_id=product.id AND status<>'archived') THEN
    RAISE EXCEPTION 'Family Room unexpectedly has assigned photos';
  END IF;

  IF EXISTS(SELECT 1 FROM public.rates WHERE room_type_id=product.id AND status<>'archived') THEN
    RAISE EXCEPTION 'Family Room unexpectedly has an invented rate';
  END IF;

  IF NOT EXISTS(
    SELECT 1 FROM public.seo_metadata
    WHERE entity_type='room_type' AND entity_id=product.id AND status='published'
      AND noindex=FALSE AND canonical_override IS NULL AND og_image_id IS NULL
  ) THEN RAISE EXCEPTION 'Family Room SEO metadata is missing or incorrect'; END IF;

  RAISE NOTICE 'Family Room seed passed: one published product, one inventory unit, 32 amenities, SEO, no photos and no invented rate.';
END $$;
