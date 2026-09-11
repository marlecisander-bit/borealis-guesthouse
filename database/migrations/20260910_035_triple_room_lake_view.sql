-- Seed the real Triple Room through the existing normalized Rooms model.
-- New records intentionally retain the room workflow defaults: draft, visible,
-- not featured and one inventory unit. No rate, SEO or media is invented.

DO $$
DECLARE
  target_property UUID;
  target_room_type UUID;
  target_inventory INTEGER;
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
    AND (
      lower(slug)='triple-room-lake-view'
      OR lower(btrim(regexp_replace(name,'\s+',' ','g'))) IN (
        'triple room with lake view',
        'lake view triple room',
        'camera tripla con vista lago'
      )
    )
  ORDER BY (lower(slug)='triple-room-lake-view') DESC,created_at
  LIMIT 1;

  IF target_room_type IS NULL THEN
    target_room_type:=gen_random_uuid();
    INSERT INTO public.room_types(
      id,property_id,name,title,slug,description,short_description,long_description,
      capacity,beds,bed_configuration,size_sqm,view_type
    ) VALUES(
      target_room_type,target_property,'Triple Room with Lake View',
      'Triple Room with Lake View','triple-room-lake-view',
      'A comfortable 24 m² triple room with three single beds, private bathroom and beautiful views of the lake, mountains and river.',
      'A comfortable 24 m² triple room with three single beds, private bathroom and beautiful views of the lake, mountains and river.',
      E'Enjoy a comfortable stay in our Triple Room with Lake View, a bright 24 m² room designed for up to three guests. The room features three single beds, air conditioning and a private entrance, offering a practical and relaxing base for exploring Koman.\n\nThe private bathroom includes a bath or shower, towels, a hairdryer and essential toiletries. Guests also have access to a refrigerator, electric kettle and tea and coffee making facilities.\n\nThe room offers beautiful views of the lake, mountains and river, while outdoor furniture and an outdoor dining area provide a pleasant place to enjoy the peaceful surroundings.\n\nLocated on the ground floor, the room is a convenient choice for friends, small families or travellers looking for a comfortable stay surrounded by the natural scenery of Koman.',
      3,3,'3 single beds',24,'Lake, mountain and river views'
    );
  ELSE
    -- Preserve workflow state, inventory, pricing, SEO, media and relationships
    -- that may already belong to an equivalent room. Only supplied room facts
    -- are normalized here.
    UPDATE public.room_types SET
      name='Triple Room with Lake View',title='Triple Room with Lake View',
      slug='triple-room-lake-view',
      description='A comfortable 24 m² triple room with three single beds, private bathroom and beautiful views of the lake, mountains and river.',
      short_description='A comfortable 24 m² triple room with three single beds, private bathroom and beautiful views of the lake, mountains and river.',
      long_description=E'Enjoy a comfortable stay in our Triple Room with Lake View, a bright 24 m² room designed for up to three guests. The room features three single beds, air conditioning and a private entrance, offering a practical and relaxing base for exploring Koman.\n\nThe private bathroom includes a bath or shower, towels, a hairdryer and essential toiletries. Guests also have access to a refrigerator, electric kettle and tea and coffee making facilities.\n\nThe room offers beautiful views of the lake, mountains and river, while outdoor furniture and an outdoor dining area provide a pleasant place to enjoy the peaceful surroundings.\n\nLocated on the ground floor, the room is a convenient choice for friends, small families or travellers looking for a comfortable stay surrounded by the natural scenery of Koman.',
      capacity=3,beds=3,bed_configuration='3 single beds',size_sqm=24,
      view_type='Lake, mountain and river views',updated_at=NOW()
    WHERE id=target_room_type;
  END IF;

  -- This factual feature has no equivalent in the current live catalogue. It
  -- uses the established amenity model and active-name uniqueness rule.
  INSERT INTO public.amenities(
    property_id,name,slug,category,description,status,is_visible,active,sort_order
  )
  SELECT target_property,'Ground-floor room','ground-floor-room','accessibility',
    'The room is located on the ground floor.','published',TRUE,TRUE,350
  WHERE NOT EXISTS(
    SELECT 1 FROM public.amenities existing
    WHERE existing.property_id=target_property AND existing.status<>'archived'
      AND (
        lower(existing.name) IN ('ground-floor room','ground floor','entire unit located on ground floor')
        OR lower(existing.slug) IN ('ground-floor-room','ground-floor','entire-unit-ground-floor')
      )
  );

  -- Add the supplied amenities without deleting any valid relationships that
  -- may already belong to an equivalent room.
  INSERT INTO public.room_type_amenities(property_id,room_type_id,amenity_id)
  SELECT target_property,target_room_type,amenity.id
  FROM public.amenities amenity
  WHERE amenity.property_id=target_property AND amenity.status<>'archived'
    AND lower(amenity.name)=ANY(ARRAY[
      'air conditioning','private entrance','free wi-fi','refrigerator',
      'coffee/tea maker','electric kettle','outdoor furniture',
      'outdoor dining area','wardrobe / closet','clothes rack',
      'ground-floor room','ground floor','entire unit located on ground floor',
      'non smoking room','private bathroom','bath or shower','towels',
      'hairdryer','toilet paper','lake view','mountain view','river view'
    ]::TEXT[])
  ON CONFLICT(room_type_id,amenity_id) DO NOTHING;

  -- The operational-unit convention is mandatory for availability. Preserve
  -- an equivalent room's count; a new room inherits inventory_count = 1.
  SELECT inventory_count INTO target_inventory
  FROM public.room_types WHERE id=target_room_type;
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',TRUE);
  PERFORM public.sync_room_inventory(target_room_type,target_inventory,NULL);
END $$;
