-- Server-authoritative availability, manual closures and future channel sync fields.
DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.booking_status AS ENUM ('pending','held','confirmed','checked_in','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS booking_status public.booking_status NOT NULL DEFAULT 'pending';
UPDATE public.bookings SET booking_status=CASE
  WHEN status IN ('pending','confirmed','checked_in','completed','cancelled') THEN status::public.booking_status
  ELSE booking_status
END;

CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE, room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT, status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(end_date>=start_date), CHECK(room_id IS NOT NULL OR room_type_id IS NOT NULL)
);
ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS reason_code TEXT NOT NULL DEFAULT 'manual_closure',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_uid TEXT,
  ADD COLUMN IF NOT EXISTS sync_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS availability_blocks_calendar_idx ON public.availability_blocks(property_id,status,start_date,end_date,room_id,room_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS availability_blocks_external_uidx ON public.availability_blocks(property_id,source,external_uid) WHERE external_uid IS NOT NULL;

ALTER TABLE public.booking_items
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL;
UPDATE public.booking_items bi SET property_id=b.property_id FROM public.bookings b WHERE bi.booking_id=b.id AND bi.property_id IS NULL;
CREATE INDEX IF NOT EXISTS booking_items_inventory_idx ON public.booking_items(property_id,room_id,room_type_id,booking_id);

CREATE OR REPLACE FUNCTION public.can_manage_availability(target_property UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE lower(email)=lower(auth.jwt()->>'email') AND property_id=target_property AND role IN ('owner','manager','staff'));
$$;
REVOKE ALL ON FUNCTION public.can_manage_availability(UUID) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.can_manage_availability(UUID) TO authenticated;

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_blocks_admin_manage" ON public.availability_blocks;
CREATE POLICY "availability_blocks_admin_manage" ON public.availability_blocks FOR ALL TO authenticated
USING(public.can_manage_availability(property_id)) WITH CHECK(public.can_manage_availability(property_id));

-- Booking and availability services should call this function before accepting inventory.
-- End dates use hotel semantics: checkout/end is exclusive for bookings, while a block's
-- end date is inclusive because that is what owners enter in the admin calendar.
CREATE OR REPLACE FUNCTION public.is_room_available(target_room UUID, stay_start DATE, stay_end DATE)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT stay_end>stay_start
AND NOT EXISTS (
  SELECT 1 FROM public.availability_blocks ab JOIN public.rooms r ON r.id=target_room
  WHERE ab.property_id=r.property_id AND ab.status='published'
    AND (ab.room_id=target_room OR ab.room_type_id=r.room_type_id)
    AND daterange(ab.start_date,ab.end_date,'[]') && daterange(stay_start,stay_end,'[)')
)
AND NOT EXISTS (
  SELECT 1 FROM public.bookings b JOIN public.booking_items bi ON bi.booking_id=b.id JOIN public.rooms r ON r.id=target_room
  WHERE b.property_id=r.property_id AND COALESCE(b.booking_status::text,b.status) IN ('pending','held','confirmed','checked_in')
    AND (bi.room_id=target_room OR bi.room_type_id=r.room_type_id OR (bi.item_type='room' AND bi.item_id=target_room))
    AND daterange(b.check_in,b.check_out,'[)') && daterange(stay_start,stay_end,'[)')
);
$$;
REVOKE ALL ON FUNCTION public.is_room_available(UUID,DATE,DATE) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.is_room_available(UUID,DATE,DATE) TO authenticated;
