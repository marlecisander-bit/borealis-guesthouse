-- Borealis Guest House: canonical Admin CMS + public website schema
-- Apply after database/schema.sql. This migration is additive and preserves legacy data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE public.content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.admin_role AS ENUM ('owner','manager','editor','staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.price_type AS ENUM ('fixed','from','quote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.booking_status AS ENUM ('pending','held','confirmed','checked_in','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending','authorized','paid','failed','refunded','partially_refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared timestamp trigger.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ---------------------------------------------------------------------------
-- Property and access control
-- ---------------------------------------------------------------------------

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Tirane',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_uidx ON public.properties (lower(slug)) WHERE slug IS NOT NULL AND status <> 'archived';

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL DEFAULT 'staff',
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, property_id)
);
CREATE INDEX IF NOT EXISTS admin_profiles_property_idx ON public.admin_profiles(property_id, role) WHERE is_active;

-- Preserve legacy admin membership by matching verified Supabase users by email.
INSERT INTO public.admin_profiles (user_id, property_id, role, display_name)
SELECT u.id, a.property_id,
  CASE WHEN a.role IN ('owner','manager','editor','staff') THEN a.role::public.admin_role ELSE 'staff'::public.admin_role END,
  split_part(a.email,'@',1)
FROM public.admin_users a JOIN auth.users u ON lower(u.email)=lower(a.email)
WHERE a.property_id IS NOT NULL
ON CONFLICT (user_id, property_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.can_manage_property(target_property UUID, allowed_roles public.admin_role[] DEFAULT ARRAY['owner','manager','editor','staff']::public.admin_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid() AND ap.property_id = target_property
      AND ap.is_active = TRUE AND ap.role = ANY(allowed_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Central media library
-- ---------------------------------------------------------------------------

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_focal_x_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_focal_x_check CHECK (focal_x IS NULL OR focal_x BETWEEN 0 AND 1);
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_focal_y_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_focal_y_check CHECK (focal_y IS NULL OR focal_y BETWEEN 0 AND 1);
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_path_uidx ON public.media_assets(property_id, file_path);
CREATE INDEX IF NOT EXISTS media_assets_public_idx ON public.media_assets(property_id,status,is_visible,sort_order);

-- ---------------------------------------------------------------------------
-- Accommodation, amenities, pricing and availability
-- ---------------------------------------------------------------------------

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS bed_configuration TEXT,
  ADD COLUMN IF NOT EXISTS view_type TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE public.room_types SET title=COALESCE(title,name) WHERE title IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS room_types_slug_uidx ON public.room_types(property_id,lower(slug)) WHERE slug IS NOT NULL AND status <> 'archived';
CREATE INDEX IF NOT EXISTS room_types_public_idx ON public.room_types(property_id,status,is_visible,sort_order);

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS rooms_inventory_idx ON public.rooms(property_id,room_type_id,status,is_available);

ALTER TABLE public.amenities
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS amenities_slug_uidx ON public.amenities(property_id,lower(slug)) WHERE slug IS NOT NULL AND status <> 'archived';

ALTER TABLE public.room_amenities ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
UPDATE public.room_amenities ra SET property_id=r.property_id FROM public.rooms r WHERE ra.room_id=r.id AND ra.property_id IS NULL;
CREATE INDEX IF NOT EXISTS room_amenities_property_idx ON public.room_amenities(property_id,room_id);

CREATE TABLE IF NOT EXISTS public.room_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(room_type_id,media_asset_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS room_images_featured_uidx ON public.room_images(room_type_id) WHERE is_featured AND status <> 'archived';

ALTER TABLE public.rates
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_to DATE,
  ADD COLUMN IF NOT EXISTS minimum_nights INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.rates DROP CONSTRAINT IF EXISTS rates_valid_dates_check;
ALTER TABLE public.rates ADD CONSTRAINT rates_valid_dates_check CHECK(valid_to IS NULL OR valid_from IS NULL OR valid_to>=valid_from);
CREATE INDEX IF NOT EXISTS rates_lookup_idx ON public.rates(property_id,room_type_id,status,valid_from,valid_to);

ALTER TABLE public.rate_rules
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE public.rate_rules rr SET property_id=r.property_id FROM public.rates r WHERE rr.rate_id=r.id AND rr.property_id IS NULL;
CREATE INDEX IF NOT EXISTS rate_rules_lookup_idx ON public.rate_rules(property_id,rate_id,status,start_date,end_date);

CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE, room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT, status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(end_date>=start_date), CHECK(room_id IS NOT NULL OR room_type_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS availability_blocks_lookup_idx ON public.availability_blocks(property_id,start_date,end_date,status);

-- ---------------------------------------------------------------------------
-- Experiences and transfers
-- ---------------------------------------------------------------------------

ALTER TABLE public.experiences ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS slug TEXT, ADD COLUMN IF NOT EXISTS title TEXT, ADD COLUMN IF NOT EXISTS short_description TEXT, ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS price_type public.price_type NOT NULL DEFAULT 'quote', ADD COLUMN IF NOT EXISTS meeting_point TEXT, ADD COLUMN IF NOT EXISTS included_items TEXT[], ADD COLUMN IF NOT EXISTS practical_notes TEXT[], ADD COLUMN IF NOT EXISTS booking_requirements TEXT[],
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft', ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE public.experiences SET title=COALESCE(title,name) WHERE title IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS experiences_slug_uidx ON public.experiences(property_id,lower(slug)) WHERE slug IS NOT NULL AND status <> 'archived';

CREATE TABLE IF NOT EXISTS public.experience_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, UNIQUE(experience_id,media_asset_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS experience_images_featured_uidx ON public.experience_images(experience_id) WHERE is_featured AND status <> 'archived';

ALTER TABLE public.experience_availability
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
UPDATE public.experience_availability ea SET property_id=e.property_id FROM public.experiences e WHERE ea.experience_id=e.id AND ea.property_id IS NULL;
CREATE INDEX IF NOT EXISTS experience_availability_lookup_idx ON public.experience_availability(property_id,experience_id,available_date,status);

CREATE TABLE IF NOT EXISTS public.transfer_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, title TEXT NOT NULL, origin TEXT NOT NULL, destination TEXT NOT NULL, description TEXT, duration_minutes INTEGER, capacity INTEGER, service_type TEXT,
  price_type public.price_type NOT NULL DEFAULT 'quote', price NUMERIC(10,2), currency CHAR(3) NOT NULL DEFAULT 'EUR', booking_notice TEXT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(price IS NULL OR price>=0), CHECK(capacity IS NULL OR capacity>0)
);
CREATE UNIQUE INDEX IF NOT EXISTS transfer_routes_slug_uidx ON public.transfer_routes(property_id,lower(slug)) WHERE status <> 'archived';

CREATE TABLE IF NOT EXISTS public.transfer_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, transfer_route_id UUID NOT NULL REFERENCES public.transfer_routes(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, UNIQUE(transfer_route_id,media_asset_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS transfer_images_featured_uidx ON public.transfer_images(transfer_route_id) WHERE is_featured AND status <> 'archived';

-- ---------------------------------------------------------------------------
-- Bookings and payments (never publicly readable)
-- ---------------------------------------------------------------------------

ALTER TABLE public.bookings ALTER COLUMN guest_id DROP NOT NULL;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS booking_status public.booking_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS taxes_fees NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_uidx ON public.bookings(property_id,reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS bookings_admin_idx ON public.bookings(property_id,check_in,check_out,booking_status);

ALTER TABLE public.booking_items
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS service_date DATE,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.booking_items bi SET property_id=b.property_id FROM public.bookings b WHERE bi.booking_id=b.id AND bi.property_id IS NULL;

CREATE TABLE IF NOT EXISTS public.booking_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT, phone TEXT, country TEXT, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS booking_primary_guest_uidx ON public.booking_guests(booking_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  provider TEXT, provider_reference TEXT, amount NUMERIC(10,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'EUR', status public.payment_status NOT NULL DEFAULT 'pending', paid_at TIMESTAMPTZ, refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK(amount>=0), CHECK(refunded_amount>=0 AND refunded_amount<=amount)
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_reference_uidx ON public.payments(provider,provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_booking_idx ON public.payments(property_id,booking_id,status);

-- ---------------------------------------------------------------------------
-- Structured website content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL, value_text TEXT, value_number NUMERIC, value_boolean BOOLEAN, media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE, status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,setting_key)
);

CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  location TEXT NOT NULL DEFAULT 'header', label TEXT NOT NULL, href TEXT NOT NULL, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,location,href)
);

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, title TEXT, subtitle TEXT, body TEXT, eyebrow TEXT, cta_label TEXT, cta_link TEXT, background_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  UNIQUE(property_id,section_key),
  CHECK(section_key IN ('hero','featured_rooms','featured_experiences','explore_koman','transfers','gallery','reviews','location','final_cta'))
);

CREATE TABLE IF NOT EXISTS public.homepage_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, icon_reference TEXT, link_url TEXT, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, title TEXT NOT NULL, description TEXT, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, published_at TIMESTAMPTZ, archived_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_uidx ON public.content_pages(property_id,lower(slug)) WHERE status <> 'archived';

CREATE TABLE IF NOT EXISTS public.content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, eyebrow TEXT, title TEXT, subtitle TEXT, body TEXT, media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL, cta_label TEXT, cta_link TEXT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(section_type IN ('hero','editorial','image_text','location','contact_details','map','cta','gallery'))
);
CREATE INDEX IF NOT EXISTS content_sections_page_idx ON public.content_sections(property_id,page_id,status,sort_order);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  title TEXT, description TEXT, category TEXT, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  UNIQUE(property_id,media_asset_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_name TEXT, origin TEXT, quote TEXT NOT NULL, rating NUMERIC(2,1), source_label TEXT, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(rating IS NULL OR rating BETWEEN 1 AND 5)
);

-- ---------------------------------------------------------------------------
-- Explore Koman editorial content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tourism_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, title TEXT NOT NULL, description TEXT, status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS tourism_categories_slug_uidx ON public.tourism_categories(property_id,lower(slug)) WHERE status <> 'archived';

CREATE TABLE IF NOT EXISTS public.tourism_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, category_id UUID REFERENCES public.tourism_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL, title TEXT NOT NULL, description TEXT, excerpt TEXT, read_time_minutes INTEGER, hero_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, published_at TIMESTAMPTZ, archived_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS tourism_articles_slug_uidx ON public.tourism_articles(property_id,lower(slug)) WHERE status <> 'archived';

CREATE TABLE IF NOT EXISTS public.tourism_article_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, article_id UUID NOT NULL REFERENCES public.tourism_articles(id) ON DELETE CASCADE,
  heading TEXT, body TEXT NOT NULL, section_type TEXT NOT NULL DEFAULT 'prose', status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, archived_at TIMESTAMPTZ,
  CHECK(section_type IN ('prose','callout','practical_info','quote'))
);

CREATE TABLE IF NOT EXISTS public.tourism_article_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, article_id UUID NOT NULL REFERENCES public.tourism_articles(id) ON DELETE CASCADE, media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  status public.content_status NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, is_featured BOOLEAN NOT NULL DEFAULT FALSE, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, UNIQUE(article_id,media_asset_id)
);

-- ---------------------------------------------------------------------------
-- SEO and translations
-- Polymorphic entity references are deliberate: these two cross-cutting tables
-- serve every CMS entity without language-specific columns or duplicate schemas.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, title TEXT, meta_description TEXT, canonical_override TEXT, og_title TEXT, og_description TEXT, og_image_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  noindex BOOLEAN NOT NULL DEFAULT FALSE, nofollow BOOLEAN NOT NULL DEFAULT FALSE, status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,entity_type,entity_id), CHECK(char_length(title)<=70), CHECK(char_length(meta_description)<=180)
);

CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  code TEXT NOT NULL, label TEXT NOT NULL, native_name TEXT NOT NULL, icon_reference TEXT, enabled BOOLEAN NOT NULL DEFAULT TRUE, is_default BOOLEAN NOT NULL DEFAULT FALSE, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,code), CHECK(code ~ '^[a-z]{2,3}(-[A-Z]{2})?$')
);
CREATE UNIQUE INDEX IF NOT EXISTS languages_one_default_uidx ON public.languages(property_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, field_name TEXT NOT NULL, translated_value TEXT NOT NULL, status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(property_id,language_id,entity_type,entity_id,field_name)
);
CREATE INDEX IF NOT EXISTS translations_lookup_idx ON public.translations(property_id,language_id,entity_type,entity_id,status);

-- ---------------------------------------------------------------------------
-- RLS: public reads explicit published/visible records; admins mutate by role.
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_profiles_self_read" ON public.admin_profiles;
CREATE POLICY "admin_profiles_self_read" ON public.admin_profiles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.can_manage_property(property_id,ARRAY['owner','manager']::public.admin_role[]));
DROP POLICY IF EXISTS "admin_profiles_owner_manage" ON public.admin_profiles;
CREATE POLICY "admin_profiles_owner_manage" ON public.admin_profiles FOR ALL TO authenticated USING (public.can_manage_property(property_id,ARRAY['owner']::public.admin_role[])) WITH CHECK (public.can_manage_property(property_id,ARRAY['owner']::public.admin_role[]));

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'room_types','rooms','amenities','room_images','rates','rate_rules','experiences','experience_images','transfer_routes','transfer_images',
    'site_settings','navigation_items','homepage_sections','homepage_highlights','content_pages','content_sections','gallery_items','reviews',
    'tourism_categories','tourism_articles','tourism_article_sections','tourism_article_images','seo_metadata','translations','media_assets'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_public_read',t);
    IF t='site_settings' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (status=''published'' AND is_public=TRUE)',t||'_public_read',t);
    ELSIF t IN ('seo_metadata','translations') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (status=''published'')',t||'_public_read',t);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (status=''published'' AND is_visible=TRUE)',t||'_public_read',t);
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_admin_manage',t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.can_manage_property(property_id,ARRAY[''owner'',''manager'',''editor'']::public.admin_role[])) WITH CHECK (public.can_manage_property(property_id,ARRAY[''owner'',''manager'',''editor'']::public.admin_role[]))',t||'_admin_manage',t);
  END LOOP;
END $$;

-- Languages have enabled/default rather than content status.
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "languages_public_read" ON public.languages;
CREATE POLICY "languages_public_read" ON public.languages FOR SELECT TO anon,authenticated USING(enabled=TRUE);
DROP POLICY IF EXISTS "languages_admin_manage" ON public.languages;
CREATE POLICY "languages_admin_manage" ON public.languages FOR ALL TO authenticated USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[])) WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));

-- Properties expose only published records. Owner/manager may update them.
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_public_read" ON public.properties;
CREATE POLICY "properties_public_read" ON public.properties FOR SELECT TO anon,authenticated USING(status='published' OR public.can_manage_property(id));
DROP POLICY IF EXISTS "properties_admin_manage" ON public.properties;
CREATE POLICY "properties_admin_manage" ON public.properties FOR UPDATE TO authenticated USING(public.can_manage_property(id,ARRAY['owner','manager']::public.admin_role[])) WITH CHECK(public.can_manage_property(id,ARRAY['owner','manager']::public.admin_role[]));

-- Relationship table with no content status.
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "room_amenities_public_read" ON public.room_amenities;
CREATE POLICY "room_amenities_public_read" ON public.room_amenities FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.rooms r WHERE r.id=room_id AND r.status='published' AND r.is_visible));
DROP POLICY IF EXISTS "room_amenities_admin_manage" ON public.room_amenities;
CREATE POLICY "room_amenities_admin_manage" ON public.room_amenities FOR ALL TO authenticated USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[])) WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));

-- Operational/private tables: no anon policies.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['availability_blocks','experience_availability','bookings','booking_items','booking_guests','payments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_admin_manage',t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.can_manage_property(property_id,ARRAY[''owner'',''manager'',''staff'']::public.admin_role[])) WITH CHECK (public.can_manage_property(property_id,ARRAY[''owner'',''manager'',''staff'']::public.admin_role[]))',t||'_admin_manage',t);
  END LOOP;
END $$;

-- Automatic updated_at maintenance.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'properties','admin_profiles','room_types','rooms','amenities','room_images','rates','rate_rules','availability_blocks','experiences','experience_images','experience_availability',
    'transfer_routes','transfer_images','bookings','booking_items','booking_guests','payments','site_settings','navigation_items','homepage_sections','homepage_highlights',
    'content_pages','content_sections','gallery_items','reviews','tourism_categories','tourism_articles','tourism_article_sections','tourism_article_images','seo_metadata','languages','translations','media_assets'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON public.%I',t,t);
    EXECUTE format('CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',t,t);
  END LOOP;
END $$;

-- Common query indexes.
CREATE INDEX IF NOT EXISTS navigation_items_public_idx ON public.navigation_items(property_id,location,status,is_visible,sort_order);
CREATE INDEX IF NOT EXISTS homepage_sections_public_idx ON public.homepage_sections(property_id,status,is_visible,sort_order);
CREATE INDEX IF NOT EXISTS homepage_highlights_public_idx ON public.homepage_highlights(property_id,status,is_visible,sort_order);
CREATE INDEX IF NOT EXISTS gallery_items_public_idx ON public.gallery_items(property_id,status,is_visible,sort_order);
CREATE INDEX IF NOT EXISTS tourism_articles_public_idx ON public.tourism_articles(property_id,category_id,status,is_visible,sort_order);
CREATE INDEX IF NOT EXISTS seo_metadata_lookup_idx ON public.seo_metadata(property_id,entity_type,entity_id,status);
