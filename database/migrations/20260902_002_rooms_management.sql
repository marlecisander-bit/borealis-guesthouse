-- Rooms Management module. Apply after 20260902_001_admin_cms_public_schema.sql.

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_occupancy INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_capacity_values_check;
ALTER TABLE public.room_types ADD CONSTRAINT room_types_capacity_values_check CHECK(capacity>0 AND adults>=0 AND children>=0 AND base_occupancy>0 AND base_occupancy<=capacity);

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_availability_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_availability_status_check CHECK(availability_status IN ('available','occupied','blocked','maintenance'));

CREATE TABLE IF NOT EXISTS public.room_type_amenities (
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY(room_type_id,amenity_id)
);
CREATE INDEX IF NOT EXISTS room_type_amenities_property_idx ON public.room_type_amenities(property_id,room_type_id);

ALTER TABLE public.room_type_amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "room_type_amenities_public_read" ON public.room_type_amenities;
CREATE POLICY "room_type_amenities_public_read" ON public.room_type_amenities FOR SELECT TO anon,authenticated
USING(EXISTS(SELECT 1 FROM public.room_types rt WHERE rt.id=room_type_id AND rt.status='published' AND rt.is_visible));
DROP POLICY IF EXISTS "room_type_amenities_admin_manage" ON public.room_type_amenities;
CREATE POLICY "room_type_amenities_admin_manage" ON public.room_type_amenities FOR ALL TO authenticated
USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]))
WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));

CREATE INDEX IF NOT EXISTS rooms_management_filter_idx ON public.rooms(property_id,room_type_id,status,active,availability_status);
