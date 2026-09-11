-- Run immediately after 20260910_036_amenity_icon_normalization.sql.
DO $$
DECLARE
  target_property CONSTANT UUID:='a7c8be03-4e80-429d-98f1-c638a0e68408';
  active_count INTEGER;
  fallback_count INTEGER;
BEGIN
  SELECT count(*) INTO active_count FROM public.amenities
  WHERE property_id=target_property AND active=TRUE AND status<>'archived';
  IF active_count<>42 THEN
    RAISE EXCEPTION 'Expected 42 active Borealis amenities, found %',active_count;
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.amenities
    WHERE property_id=target_property AND active=TRUE AND status<>'archived'
      AND COALESCE(icon,'') NOT IN (
        'wifi','internet','parking','airport-shuttle','shuttle','non-smoking','room-service','family-rooms',
        'coffee-maker','breakfast','restaurant','bar','private-beach','lake-access','lake-view','mountain-view',
        'river-view','garden-view','air-conditioning','heating','private-entrance','private-bathroom','bath',
        'shower','bath-shower','hairdryer','towels','toilet-paper','toiletries','balcony','terrace',
        'outdoor-furniture','outdoor-dining','garden','bbq','accessible','ground-floor','stairs','tv',
        'flat-screen-tv','minibar','wardrobe','clothes-rack','iron','ironing-facilities','sofa-bed','desk',
        'seating-area','private-kitchen','refrigerator','oven','kettle','kitchenware','washing-machine',
        'dining-table','dining-area','tour-desk','luggage','fishing','hiking','kayaking','water-activities','sparkles'
      )
  ) THEN RAISE EXCEPTION 'An active amenity has a missing or unsupported icon key'; END IF;

  SELECT count(*) INTO fallback_count FROM public.amenities
  WHERE property_id=target_property AND active=TRUE AND status<>'archived' AND icon='sparkles';
  IF fallback_count<>0 THEN
    RAISE EXCEPTION 'Expected all 42 live amenities to map semantically; % require review',fallback_count;
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.amenities
    WHERE property_id=target_property AND active=TRUE AND status<>'archived'
    GROUP BY lower(trim(name)) HAVING count(*)>1
  ) THEN RAISE EXCEPTION 'Duplicate active amenity names require review'; END IF;

  RAISE NOTICE 'Amenity icons passed: 42 active, 42 semantic mappings, 0 fallbacks and 0 duplicate names.';
END $$;
