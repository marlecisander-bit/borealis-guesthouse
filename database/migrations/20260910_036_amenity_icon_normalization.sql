-- Normalize amenity icon keys without changing amenity identity, catalogue
-- metadata or room relationships. Existing valid manual choices always win.

WITH mapped(normalized_name,icon_key) AS (VALUES
  ('free parking','parking'),
  ('breakfast included in the price','breakfast'),
  ('private beach','private-beach'),
  ('coffee tea maker','coffee-maker'),
  ('non smoking room','non-smoking'),
  ('air conditioning','air-conditioning'),
  ('airport shuttle','airport-shuttle'),
  ('room service','room-service'),
  ('family room','family-rooms'),
  ('lake view','lake-view'),
  ('bar','bar'),
  ('private bathroom','private-bathroom'),
  ('balcony','balcony'),
  ('accessible','accessible'),
  ('tv','tv'),
  ('minibar','minibar'),
  ('private entrance','private-entrance'),
  ('free wi fi','wifi'),
  ('wardrobe closet','wardrobe'),
  ('clothes rack','clothes-rack'),
  ('iron','iron'),
  ('ironing facilities','ironing-facilities'),
  ('outdoor furniture','outdoor-furniture'),
  ('outdoor dining area','outdoor-dining'),
  ('dining area','dining-area'),
  ('dining table','dining-table'),
  ('upper floors accessible by stairs only','stairs'),
  ('sofa bed','sofa-bed'),
  ('private kitchen','private-kitchen'),
  ('refrigerator','refrigerator'),
  ('oven','oven'),
  ('electric kettle','kettle'),
  ('kitchenware','kitchenware'),
  ('washing machine','washing-machine'),
  ('bath or shower','bath-shower'),
  ('towels','towels'),
  ('hairdryer','hairdryer'),
  ('toilet paper','toilet-paper'),
  ('garden view','garden-view'),
  ('mountain view','mountain-view'),
  ('river view','river-view'),
  ('ground floor room','ground-floor')
), valid(icon_key) AS (VALUES
  ('wifi'),('internet'),('parking'),('airport-shuttle'),('shuttle'),
  ('non-smoking'),('room-service'),('family-rooms'),('coffee-maker'),
  ('breakfast'),('restaurant'),('bar'),('private-beach'),('lake-access'),
  ('lake-view'),('mountain-view'),('river-view'),('garden-view'),
  ('air-conditioning'),('heating'),('private-entrance'),('private-bathroom'),
  ('bath'),('shower'),('bath-shower'),('hairdryer'),('towels'),
  ('toilet-paper'),('toiletries'),('balcony'),('terrace'),
  ('outdoor-furniture'),('outdoor-dining'),('garden'),('bbq'),('accessible'),
  ('ground-floor'),('stairs'),('tv'),('flat-screen-tv'),('minibar'),
  ('wardrobe'),('clothes-rack'),('iron'),('ironing-facilities'),('sofa-bed'),
  ('desk'),('seating-area'),('private-kitchen'),('refrigerator'),('oven'),
  ('kettle'),('kitchenware'),('washing-machine'),('dining-table'),
  ('dining-area'),('tour-desk'),('luggage'),('fishing'),('hiking'),
  ('kayaking'),('water-activities'),('sparkles')
), candidates AS (
  SELECT amenity.id,mapped.icon_key
  FROM public.amenities amenity
  JOIN mapped ON mapped.normalized_name=trim(regexp_replace(
    lower(replace(amenity.name,'&',' and ')),
    '[^a-z0-9]+',' ','g'
  ))
  WHERE amenity.status<>'archived'
    AND NOT EXISTS(SELECT 1 FROM valid WHERE valid.icon_key=amenity.icon)
)
UPDATE public.amenities amenity
SET icon=candidates.icon_key
FROM candidates
WHERE amenity.id=candidates.id;

-- Unknown active names receive the neutral shared icon. This protects public
-- rendering while leaving the visible amenity label available for review.
UPDATE public.amenities
SET icon='sparkles'
WHERE active=TRUE AND status<>'archived'
  AND COALESCE(icon,'') NOT IN (
    'wifi','internet','parking','airport-shuttle','shuttle','non-smoking',
    'room-service','family-rooms','coffee-maker','breakfast','restaurant','bar',
    'private-beach','lake-access','lake-view','mountain-view','river-view',
    'garden-view','air-conditioning','heating','private-entrance',
    'private-bathroom','bath','shower','bath-shower','hairdryer','towels',
    'toilet-paper','toiletries','balcony','terrace','outdoor-furniture',
    'outdoor-dining','garden','bbq','accessible','ground-floor','stairs','tv',
    'flat-screen-tv','minibar','wardrobe','clothes-rack','iron',
    'ironing-facilities','sofa-bed','desk','seating-area','private-kitchen',
    'refrigerator','oven','kettle','kitchenware','washing-machine',
    'dining-table','dining-area','tour-desk','luggage','fishing','hiking',
    'kayaking','water-activities','sparkles'
  );

-- Keep future active records inside the same stable-key contract even when a
-- write bypasses the Admin form. Inactive historical rows may retain an old
-- value until an owner edits or restores them.
ALTER TABLE public.amenities DROP CONSTRAINT IF EXISTS amenities_active_icon_key_check;
ALTER TABLE public.amenities ADD CONSTRAINT amenities_active_icon_key_check CHECK(
  NOT active OR status='archived' OR icon IN (
    'wifi','internet','parking','airport-shuttle','shuttle','non-smoking',
    'room-service','family-rooms','coffee-maker','breakfast','restaurant','bar',
    'private-beach','lake-access','lake-view','mountain-view','river-view',
    'garden-view','air-conditioning','heating','private-entrance',
    'private-bathroom','bath','shower','bath-shower','hairdryer','towels',
    'toilet-paper','toiletries','balcony','terrace','outdoor-furniture',
    'outdoor-dining','garden','bbq','accessible','ground-floor','stairs','tv',
    'flat-screen-tv','minibar','wardrobe','clothes-rack','iron',
    'ironing-facilities','sofa-bed','desk','seating-area','private-kitchen',
    'refrigerator','oven','kettle','kitchenware','washing-machine',
    'dining-table','dining-area','tour-desk','luggage','fishing','hiking',
    'kayaking','water-activities','sparkles'
  )
);
