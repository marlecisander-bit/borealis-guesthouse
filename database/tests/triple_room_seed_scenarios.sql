-- Run immediately after 20260910_035_triple_room_lake_view.sql.
DO $$
DECLARE
  product public.room_types%ROWTYPE;
  expected_amenities TEXT[]:=ARRAY[
    'air conditioning','private entrance','free wi-fi','refrigerator',
    'coffee/tea maker','electric kettle','outdoor furniture',
    'outdoor dining area','wardrobe / closet','clothes rack',
    'ground-floor room','non smoking room','private bathroom','bath or shower',
    'towels','hairdryer','toilet paper','lake view','mountain view','river view'
  ];
  missing_count INTEGER;
BEGIN
  IF (SELECT count(*) FROM public.room_types
      WHERE lower(slug)='triple-room-lake-view' AND status<>'archived')<>1 THEN
    RAISE EXCEPTION 'Triple Room is missing or duplicated';
  END IF;

  SELECT * INTO product FROM public.room_types
  WHERE lower(slug)='triple-room-lake-view' AND status<>'archived';

  IF product.name<>'Triple Room with Lake View' OR product.capacity<>3
     OR product.size_sqm<>24 OR product.beds<>3
     OR product.bed_configuration<>'3 single beds' THEN
    RAISE EXCEPTION 'Triple Room core fields are incorrect';
  END IF;

  SELECT count(*) INTO missing_count
  FROM unnest(expected_amenities) expected(name)
  WHERE NOT EXISTS(
    SELECT 1 FROM public.room_type_amenities link
    JOIN public.amenities amenity ON amenity.id=link.amenity_id
    WHERE link.room_type_id=product.id AND lower(amenity.name)=expected.name
  );
  IF missing_count<>0 THEN
    RAISE EXCEPTION 'Triple Room is missing % requested amenities',missing_count;
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.amenities amenity
    WHERE amenity.property_id=product.property_id AND amenity.status<>'archived'
      AND lower(amenity.name)=ANY(expected_amenities)
    GROUP BY lower(amenity.name) HAVING count(*)>1
  ) THEN RAISE EXCEPTION 'Duplicate canonical amenities exist'; END IF;

  IF (SELECT count(*) FROM public.rooms
      WHERE room_type_id=product.id AND status<>'archived')<>product.inventory_count THEN
    RAISE EXCEPTION 'Operational units do not match preserved inventory';
  END IF;

  IF EXISTS(SELECT 1 FROM public.room_images
            WHERE room_type_id=product.id AND status<>'archived') THEN
    RAISE EXCEPTION 'Triple Room unexpectedly has assigned photos';
  END IF;
  IF EXISTS(SELECT 1 FROM public.rates
            WHERE room_type_id=product.id AND status<>'archived') THEN
    RAISE EXCEPTION 'Triple Room unexpectedly has an invented rate';
  END IF;
  IF EXISTS(SELECT 1 FROM public.seo_metadata
            WHERE entity_type='room_type' AND entity_id=product.id) THEN
    RAISE EXCEPTION 'Triple Room unexpectedly has invented SEO';
  END IF;

  IF product.status<>'draft' OR NOT product.is_visible OR product.is_featured
     OR product.inventory_count<>1 THEN
    RAISE EXCEPTION 'New-room workflow defaults were not preserved';
  END IF;

  RAISE NOTICE 'Triple Room seed passed: draft room, 20 amenities, one inventory unit, no media, no rate and no SEO.';
END $$;
