-- Normalize the existing Rooms and Amenities modules without replacing tables.

-- Composite keys allow junction rows to prove that every linked record belongs
-- to the same property.
CREATE UNIQUE INDEX IF NOT EXISTS room_types_property_id_id_uidx ON public.room_types(property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS amenities_property_id_id_uidx ON public.amenities(property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS rooms_property_id_id_uidx ON public.rooms(property_id, id);

ALTER TABLE public.room_type_amenities DROP CONSTRAINT IF EXISTS room_type_amenities_property_room_type_fk;
ALTER TABLE public.room_type_amenities ADD CONSTRAINT room_type_amenities_property_room_type_fk
  FOREIGN KEY(property_id, room_type_id) REFERENCES public.room_types(property_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.room_type_amenities DROP CONSTRAINT IF EXISTS room_type_amenities_property_amenity_fk;
ALTER TABLE public.room_type_amenities ADD CONSTRAINT room_type_amenities_property_amenity_fk
  FOREIGN KEY(property_id, amenity_id) REFERENCES public.amenities(property_id, id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.room_images DROP CONSTRAINT IF EXISTS room_images_property_room_type_fk;
ALTER TABLE public.room_images ADD CONSTRAINT room_images_property_room_type_fk
  FOREIGN KEY(property_id, room_type_id) REFERENCES public.room_types(property_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.room_images DROP CONSTRAINT IF EXISTS room_images_property_media_fk;
ALTER TABLE public.room_images ADD CONSTRAINT room_images_property_media_fk
  FOREIGN KEY(property_id, media_asset_id) REFERENCES public.media_assets(property_id, id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_property_room_type_fk;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_property_room_type_fk
  FOREIGN KEY(property_id, room_type_id) REFERENCES public.room_types(property_id, id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.room_type_amenities VALIDATE CONSTRAINT room_type_amenities_property_room_type_fk;
ALTER TABLE public.room_type_amenities VALIDATE CONSTRAINT room_type_amenities_property_amenity_fk;
ALTER TABLE public.room_images VALIDATE CONSTRAINT room_images_property_room_type_fk;
ALTER TABLE public.room_images VALIDATE CONSTRAINT room_images_property_media_fk;
ALTER TABLE public.rooms VALIDATE CONSTRAINT rooms_property_room_type_fk;

ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_guest_breakdown_check;
ALTER TABLE public.room_types ADD CONSTRAINT room_types_guest_breakdown_check
  CHECK(adults >= 0 AND children >= 0 AND adults + children <= capacity);
ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_size_check;
ALTER TABLE public.room_types ADD CONSTRAINT room_types_size_check CHECK(size_sqm IS NULL OR size_sqm > 0);

-- Replace the legacy email-based amenities policy installed by migration 003.
DROP POLICY IF EXISTS amenities_public_read ON public.amenities;
CREATE POLICY amenities_public_read ON public.amenities FOR SELECT TO anon, authenticated
  USING(status = 'published' AND is_visible = TRUE AND active = TRUE);
DROP POLICY IF EXISTS amenities_admin_manage ON public.amenities;
CREATE POLICY amenities_admin_manage ON public.amenities FOR ALL TO authenticated
  USING(public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

DROP POLICY IF EXISTS room_type_amenities_public_read ON public.room_type_amenities;
CREATE POLICY room_type_amenities_public_read ON public.room_type_amenities FOR SELECT TO anon, authenticated
  USING(EXISTS(SELECT 1 FROM public.room_types rt WHERE rt.id=room_type_id AND rt.property_id=room_type_amenities.property_id AND rt.status='published' AND rt.is_visible));
DROP POLICY IF EXISTS room_type_amenities_admin_manage ON public.room_type_amenities;
CREATE POLICY room_type_amenities_admin_manage ON public.room_type_amenities FOR ALL TO authenticated
  USING(public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id, ARRAY['owner','manager','editor']::public.admin_role[]));

CREATE INDEX IF NOT EXISTS room_types_admin_lookup_idx ON public.room_types(property_id,status,sort_order);
CREATE INDEX IF NOT EXISTS rooms_admin_lookup_idx ON public.rooms(property_id,status,room_type_id,active);
CREATE INDEX IF NOT EXISTS room_images_admin_lookup_idx ON public.room_images(property_id,room_type_id,status,sort_order);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.room_type_amenities link
    JOIN public.room_types room_type ON room_type.id=link.room_type_id
    JOIN public.amenities amenity ON amenity.id=link.amenity_id
    WHERE link.property_id<>room_type.property_id OR link.property_id<>amenity.property_id
  ) THEN RAISE EXCEPTION 'Cross-property room amenity relationship found'; END IF;
END $$;
