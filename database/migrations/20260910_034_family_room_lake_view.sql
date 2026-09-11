-- Seed the real Family Room through the existing normalized Rooms model.
-- This migration is idempotent: a matching draft/archived record is restored
-- and updated instead of creating a duplicate. Pricing and media remain empty.

DO $$
DECLARE
  target_property UUID;
  target_room_type UUID;
BEGIN
  SELECT id INTO target_property
  FROM public.properties
  WHERE id='a7c8be03-4e80-429d-98f1-c638a0e68408'::UUID;

  IF target_property IS NULL THEN
    RAISE EXCEPTION 'The Borealis property was not found';
  END IF;

  SELECT id INTO target_room_type
  FROM public.room_types
  WHERE property_id=target_property
    AND (lower(slug)='family-room-lake-view' OR lower(name)='family room with lake view')
  ORDER BY (lower(slug)='family-room-lake-view') DESC,created_at
  LIMIT 1;

  IF target_room_type IS NULL THEN
    target_room_type:=gen_random_uuid();
    INSERT INTO public.room_types(
      id,property_id,name,title,slug,description,short_description,long_description,
      capacity,beds,bed_configuration,size_sqm,view_type,adults,children,
      base_occupancy,inventory_count,is_featured,is_visible,status,sort_order,
      archived_at
    ) VALUES(
      target_room_type,target_property,'Family Room with Lake View',
      'Family Room with Lake View','family-room-lake-view',
      'A spacious 45 m² family room with four single beds and a sofa bed, private kitchen, balcony and beautiful views of the lake, mountains, river and garden.',
      'A spacious 45 m² family room with four single beds and a sofa bed, private kitchen, balcony and beautiful views of the lake, mountains, river and garden.',
      E'Designed for families and small groups, our Family Room with Lake View offers 45 m² of comfortable space and can accommodate up to five guests. The room features four single beds and a sofa bed, providing a flexible and practical layout for longer or more relaxed stays in Koman.\n\nThe room includes a fully equipped private kitchen with a refrigerator, oven, electric kettle, dining table and kitchenware, allowing guests to prepare meals independently during their stay.\n\nGuests also have a private bathroom with a bath or shower, towels, a hairdryer and essential toiletries.\n\nThe room is air-conditioned and includes a private entrance, flat-screen TV, wardrobe, clothes rack and ironing facilities.\n\nOne of its highlights is the balcony and outdoor dining area, where guests can enjoy peaceful views of Lake Koman, the surrounding mountains, river and garden.\n\nThis room is an excellent choice for families or groups looking for additional space, privacy and the flexibility of having their own kitchen while staying close to the natural beauty of Koman.',
      5,5,'4 single beds and 1 sofa bed',45,
      'Lake, garden, mountain and river views',5,0,5,1,FALSE,TRUE,
      'published',20,NULL
    );
  ELSE
    UPDATE public.room_types SET
      name='Family Room with Lake View',title='Family Room with Lake View',
      slug='family-room-lake-view',
      description='A spacious 45 m² family room with four single beds and a sofa bed, private kitchen, balcony and beautiful views of the lake, mountains, river and garden.',
      short_description='A spacious 45 m² family room with four single beds and a sofa bed, private kitchen, balcony and beautiful views of the lake, mountains, river and garden.',
      long_description=E'Designed for families and small groups, our Family Room with Lake View offers 45 m² of comfortable space and can accommodate up to five guests. The room features four single beds and a sofa bed, providing a flexible and practical layout for longer or more relaxed stays in Koman.\n\nThe room includes a fully equipped private kitchen with a refrigerator, oven, electric kettle, dining table and kitchenware, allowing guests to prepare meals independently during their stay.\n\nGuests also have a private bathroom with a bath or shower, towels, a hairdryer and essential toiletries.\n\nThe room is air-conditioned and includes a private entrance, flat-screen TV, wardrobe, clothes rack and ironing facilities.\n\nOne of its highlights is the balcony and outdoor dining area, where guests can enjoy peaceful views of Lake Koman, the surrounding mountains, river and garden.\n\nThis room is an excellent choice for families or groups looking for additional space, privacy and the flexibility of having their own kitchen while staying close to the natural beauty of Koman.',
      capacity=5,beds=5,bed_configuration='4 single beds and 1 sofa bed',
      size_sqm=45,view_type='Lake, garden, mountain and river views',
      adults=5,children=0,base_occupancy=5,inventory_count=1,
      is_visible=TRUE,status='published',archived_at=NULL,updated_at=NOW()
    WHERE id=target_room_type;
  END IF;

  -- Reuse the existing catalogue names. Only genuinely missing canonical
  -- amenities are inserted, protected by the catalogue's case-insensitive
  -- uniqueness rule.
  INSERT INTO public.amenities(
    property_id,name,slug,category,description,status,is_visible,active,sort_order
  )
  SELECT target_property,seed.name,seed.slug,seed.category,
    'Room feature for Borealis accommodation.','published',TRUE,TRUE,seed.sort_order
  FROM (VALUES
    ('Private entrance','private-entrance','room',100),
    ('Free Wi-Fi','free-wifi','services',110),
    ('Wardrobe / closet','wardrobe-closet','room',120),
    ('Clothes rack','clothes-rack','room',130),
    ('Iron','iron','room',140),
    ('Ironing facilities','ironing-facilities','room',150),
    ('Outdoor furniture','outdoor-furniture','outdoor',160),
    ('Outdoor dining area','outdoor-dining-area','outdoor',170),
    ('Dining area','dining-area','room',180),
    ('Dining table','dining-table','food',190),
    ('Upper floors accessible by stairs only','upper-floors-stairs-only','accessibility',200),
    ('Sofa bed','sofa-bed','room',210),
    ('Private kitchen','private-kitchen','food',220),
    ('Refrigerator','refrigerator','food',230),
    ('Oven','oven','food',240),
    ('Electric kettle','electric-kettle','food',250),
    ('Kitchenware','kitchenware','food',260),
    ('Washing machine','washing-machine','room',270),
    ('Bath or shower','bath-or-shower','bathroom',280),
    ('Towels','towels','bathroom',290),
    ('Hairdryer','hairdryer','bathroom',300),
    ('Toilet paper','toilet-paper','bathroom',310),
    ('Garden view','garden-view','room',320),
    ('Mountain view','mountain-view','room',330),
    ('River view','river-view','room',340)
  ) AS seed(name,slug,category,sort_order)
  WHERE NOT EXISTS(
    SELECT 1 FROM public.amenities existing
    WHERE existing.property_id=target_property
      AND lower(existing.name)=lower(seed.name)
      AND existing.status<>'archived'
  );

  DELETE FROM public.room_type_amenities WHERE room_type_id=target_room_type;
  INSERT INTO public.room_type_amenities(property_id,room_type_id,amenity_id)
  SELECT target_property,target_room_type,amenity.id
  FROM public.amenities amenity
  WHERE amenity.property_id=target_property AND amenity.status<>'archived'
    AND lower(amenity.name)=ANY(ARRAY[
      'balcony','air conditioning','private entrance','free wi-fi','tv',
      'wardrobe / closet','clothes rack','iron','ironing facilities',
      'outdoor furniture','outdoor dining area','dining area','dining table',
      'upper floors accessible by stairs only','sofa bed','private kitchen',
      'refrigerator','oven','electric kettle','kitchenware','coffee/tea maker',
      'washing machine','private bathroom','bath or shower','towels','hairdryer',
      'toilet paper','lake view','garden view','mountain view','river view',
      'non smoking room'
    ]::TEXT[])
  ON CONFLICT(room_type_id,amenity_id) DO NOTHING;

  INSERT INTO public.seo_metadata(
    property_id,entity_type,entity_id,title,meta_description,og_title,
    og_description,canonical_override,og_image_id,noindex,nofollow,status,
    published_at
  ) VALUES(
    target_property,'room_type',target_room_type,
    'Family Room with Lake View in Koman | Borealis Guest House',
    'Stay in our spacious 45 m² Family Room with Lake View in Koman, featuring four single beds, a sofa bed, private kitchen, balcony and beautiful lake and mountain views.',
    'Family Room with Lake View | Borealis Guest House',
    'A spacious family room in Koman with a private kitchen, balcony, five sleeping places and beautiful views of Lake Koman and the surrounding mountains.',
    NULL,NULL,FALSE,FALSE,'published',NOW()
  )
  ON CONFLICT(property_id,entity_type,entity_id) DO UPDATE SET
    title=EXCLUDED.title,meta_description=EXCLUDED.meta_description,
    og_title=EXCLUDED.og_title,og_description=EXCLUDED.og_description,
    canonical_override=NULL,og_image_id=NULL,noindex=FALSE,nofollow=FALSE,
    status='published',published_at=NOW(),updated_at=NOW();

  -- The inventory engine creates exactly one operational unit. No rate and no
  -- room_images rows are created by this seed. Supabase SQL Editor/migration
  -- sessions do not carry an end-user JWT, so grant this transaction the same
  -- service-role claim used by database migrations and acceptance fixtures.
  -- The setting is transaction-local and does not change Admin authorization.
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  PERFORM public.sync_room_inventory(target_room_type,1,NULL);
END $$;
