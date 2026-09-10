# Borealis Database Setup Guide

This guide explains how to set up the Supabase database for the Borealis platform.

## Prerequisites

1. Supabase account created at https://supabase.com
2. Project created in Supabase dashboard
3. Supabase credentials configured in `.env.local`

## Steps to Set Up Database

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: `borealis-production` (or `borealis-staging`)
   - Database Password: Choose a strong password
   - Region: Select closest to your users
4. Wait for project to initialize

### 2. Configure Environment Variables

After your Supabase project is created:

1. Go to project Settings → API
2. Copy the following credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 3. Run Database Schema

The database schema is defined in `database/schema.sql`. You have two options:

#### Option A: Using Supabase Dashboard SQL Editor (Recommended for First Setup)

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `database/schema.sql`
4. Paste into SQL Editor
5. Click "Run"

#### Option B: Using Supabase CLI (After setup)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref <your-project-ref>
```

3. Apply migrations:
```bash
supabase db push
```

### 4. Set Up Authentication

After schema is created:

1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure "Email" provider is enabled (default)
3. Note the API credentials for Phase 2/3 implementation

### 5. Configure Storage Buckets

For media files (images):

1. Go to Storage → Buckets
2. Create bucket named `property-media` (public)
3. Create bucket named `admin-uploads` (private)

Configure bucket policies as needed in Phase 5+

## Database Tables Overview

### Core Tables

- **properties**: Guest house/property information (multi-property ready)
- **room_types**: Room categories (e.g., Deluxe, Standard)
- **rooms**: Individual rooms
- **amenities**: Room amenities (e.g., WiFi, Air Conditioning)
- **room_amenities**: Junction table for room-amenity relationships

### Pricing Tables

- **rates**: Base pricing per room type
- **rate_rules**: Dynamic pricing rules (seasonal, discounts, minimum stay)

### Availability Tables

- **availability**: Daily availability tracking per room

### Booking Tables

- **guests**: Guest information
- **bookings**: Guest reservations with status tracking
- **booking_items**: Items within a booking (rooms, experiences, transfers)

### Services Tables

- **experiences**: Bookable activities (kayaking, boat trips, etc.)
- **experience_availability**: Schedule for experiences
- **transfers**: Transportation services (airport, Shkoder, etc.)

### Media & CMS Tables

- **media_assets**: Images and media files
- **pages**: CMS pages (homepage, about, contact)
- **page_sections**: Flexible page sections with JSONB content

### Admin Tables

- **admin_users**: Staff and owner accounts
- **settings**: Configuration key-value pairs

## Key Design Principles

1. **Multi-Property Ready**: All tables have `property_id` for future expansion
2. **Soft Delete**: Uses `is_available`/`is_visible` rather than hard deletion
3. **Audit Trail**: All tables include `created_at` and `updated_at` timestamps
4. **Performance**: Strategic indexes for common queries
5. **Flexible Content**: Uses JSONB for flexible page sections

## Next Steps

After database setup:

1. ✓ Schema created
2. ✓ Storage buckets configured
3. → Implement admin dashboard (Phase 2)
4. → Add Row Level Security (Phase 2)
5. → Create API endpoints (Phase 3)

## Testing Queries

To verify your setup, you can run these basic queries in Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Insert test property
INSERT INTO properties (name, location, currency)
VALUES ('Borealis Test', 'Koman Lake, Albania', 'USD')
RETURNING *;

-- Verify insertion
SELECT * FROM properties;
```

## Troubleshooting

### Connection Issues
- Verify `.env.local` has correct credentials
- Check project is in active state in Supabase dashboard
- Ensure network allows connections to Supabase

### Schema Errors
- Check for duplicate function/type definitions
- Verify PostgreSQL syntax
- Run one statement at a time if batch fails

### Performance
- Monitor slow queries in Supabase dashboard
- Review indexes were created successfully
- Consider connection pooling in Phase 7

## Security Notes

1. Never commit real credentials to version control
2. Use `.env.local` for development only
3. Implement Row Level Security (RLS) in Phase 2 for multi-user support
4. Create separate database users for different roles
5. Regular backups configured in Supabase dashboard

---

**Last Updated**: 2026-09-02
**Phase**: 1 - Foundation
