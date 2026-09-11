-- Repair the original single-property bootstrap state. Earlier setup created
-- the property with the generic `draft` default, so Admin remained available
-- while anonymous room and booking queries could not see the property.
--
-- Only a genuinely configured property is promoted: it must already have a
-- published room product, a published physical unit and an active base rate.
-- Owners can still move the property back to Draft from Admin -> Settings.
UPDATE public.properties property
SET status='published', updated_at=NOW()
WHERE property.status='draft'
  AND EXISTS (
    SELECT 1
    FROM public.room_types room_type
    WHERE room_type.property_id=property.id
      AND room_type.status='published'
      AND room_type.is_visible=TRUE
  )
  AND EXISTS (
    SELECT 1
    FROM public.rooms room
    WHERE room.property_id=property.id
      AND room.status='published'
      AND room.is_visible=TRUE
      AND room.active=TRUE
      AND room.availability_status='available'
  )
  AND EXISTS (
    SELECT 1
    FROM public.rates rate
    WHERE rate.property_id=property.id
      AND rate.status='published'
      AND rate.is_visible=TRUE
      AND rate.active=TRUE
      AND rate.base_price IS NOT NULL
  );
