-- Borealis Guest House Database Schema (Phase 1 - Foundation)
-- This schema is designed to be multi-property ready from the beginning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROPERTIES & ROOMS
-- ============================================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  beds INTEGER NOT NULL,
  size_sqm DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  "view" VARCHAR(100),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, room_number)
);

-- ============================================================================
-- AMENITIES
-- ============================================================================

CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_amenities (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, amenity_id)
);

-- ============================================================================
-- PRICING & RATES
-- ============================================================================

CREATE TABLE rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  base_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rate_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_id UUID NOT NULL REFERENCES rates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'seasonal', 'discount', 'minimum_stay'
  start_date DATE,
  end_date DATE,
  multiplier DECIMAL(3, 2),
  discount_percent DECIMAL(5, 2),
  minimum_nights INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AVAILABILITY
-- ============================================================================

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  "date" DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  booked_count INTEGER DEFAULT 0,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, "date")
);

CREATE INDEX idx_availability_room_date ON availability(room_id, "date");

-- ============================================================================
-- GUESTS & BOOKINGS
-- ============================================================================

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'room', 'experience', 'transfer'
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);

-- ============================================================================
-- EXPERIENCES & TRANSFERS
-- ============================================================================

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  duration_minutes INTEGER,
  max_capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experience_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  max_bookings INTEGER NOT NULL,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(experience_id, available_date)
);

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  route_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MEDIA
-- ============================================================================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  title VARCHAR(255),
  file_type VARCHAR(50),
  size_bytes INTEGER,
  placement VARCHAR(50) NOT NULL DEFAULT 'gallery',
  related_slug VARCHAR(255),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PAGES & CMS CONTENT
-- ============================================================================

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, slug)
);

CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,
  content JSONB,
  display_order INTEGER,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ADMIN & AUTHENTICATION
-- ============================================================================

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'staff', -- 'owner', 'manager', 'staff'
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS & CONFIGURATION
-- ============================================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  "key" VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, "key")
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_rooms_room_type ON rooms(room_type_id);
CREATE INDEX idx_amenities_property ON amenities(property_id);
CREATE INDEX idx_rates_property_type ON rates(property_id, room_type_id);
CREATE INDEX idx_experiences_property ON experiences(property_id);
CREATE INDEX idx_transfers_property ON transfers(property_id);
CREATE INDEX idx_media_property ON media_assets(property_id);
CREATE INDEX idx_pages_property ON pages(property_id);
CREATE INDEX idx_admin_users_property ON admin_users(property_id);
CREATE INDEX idx_settings_property ON settings(property_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- To be configured based on auth requirements in Phase 2/3

-- Note: Supabase will handle authentication and RLS policies
-- These policies should be created through Supabase dashboard or migrations
-- after auth structure is finalized
