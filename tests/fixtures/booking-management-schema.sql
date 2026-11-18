CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE EXTENSION btree_gist;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
CREATE TYPE public.admin_role AS ENUM ('owner','manager','editor','staff');
CREATE TABLE properties(id uuid PRIMARY KEY,email text,status text DEFAULT 'published');
CREATE TABLE admin_profiles(user_id uuid,property_id uuid,role admin_role,is_active boolean DEFAULT true);
CREATE FUNCTION public.can_manage_property(target uuid,roles admin_role[]) RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS(SELECT 1 FROM admin_profiles WHERE property_id=target AND user_id=auth.uid() AND role=ANY(roles) AND is_active)
$$;
CREATE TABLE bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid REFERENCES properties(id),public_token uuid UNIQUE,
 reference text,source text,status text,booking_status text,payment_status text,payment_method text,notes text,
 check_in date,check_out date,adults integer,children integer,infants integer,total_guests integer,
 subtotal numeric,room_subtotal numeric,addons_subtotal numeric,taxes_fees numeric,discount_amount numeric,total_amount numeric,currency text,
 hold_expires_at timestamptz,updated_at timestamptz DEFAULT now(),created_by uuid,updated_by uuid);
CREATE TABLE room_types(id uuid PRIMARY KEY,property_id uuid,name text,capacity integer,base_occupancy integer,
 status text DEFAULT 'published',is_visible boolean DEFAULT true,max_adults integer,max_children integer,max_infants integer,
 max_total_occupancy integer,min_adults integer,infants_count_toward_capacity boolean);
CREATE TABLE rooms(id uuid PRIMARY KEY,property_id uuid,room_type_id uuid,room_number text,title text,active boolean DEFAULT true,
 status text DEFAULT 'published',availability_status text DEFAULT 'available');
CREATE TABLE room_reservations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,booking_id uuid REFERENCES bookings(id),
 room_id uuid,check_in date,check_out date,booking_status text,hold_expires_at timestamptz,
 EXCLUDE USING gist(room_id WITH =,daterange(check_in,check_out,'[)') WITH &&)
 WHERE (booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')));
CREATE TABLE booking_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid REFERENCES bookings(id),property_id uuid,
 item_type text,item_id uuid,room_id uuid,room_type_id uuid,title_snapshot text,quantity integer,
 unit_price numeric,total_price numeric,currency text,item_status text DEFAULT 'held',metadata jsonb DEFAULT '{}'::jsonb,updated_at timestamptz);
CREATE TABLE booking_guests(id uuid DEFAULT gen_random_uuid(),property_id uuid,booking_id uuid,first_name text,last_name text,
 email text,phone text,country text,is_primary boolean,created_at timestamptz DEFAULT now());
CREATE TABLE payments(booking_id uuid);
CREATE TABLE site_settings(property_id uuid,setting_key text,value_text text,value_number numeric,value_boolean boolean,is_public boolean,
 status text DEFAULT 'published',UNIQUE(property_id,setting_key));
CREATE TABLE rates(property_id uuid,room_type_id uuid,base_price numeric,currency text,status text DEFAULT 'published',is_visible boolean DEFAULT true,active boolean DEFAULT true);
CREATE TABLE pricing_rules(property_id uuid,room_type_id uuid,status text,active boolean,rule_type text,start_date date,end_date date,nights integer,
 amount numeric,currency text,weekdays smallint[],percentage numeric);
CREATE TABLE seasonal_rate_periods(id uuid,property_id uuid,status text,active boolean,start_date date,end_date date,nightly_price numeric,currency text);
CREATE TABLE seasonal_rate_room_types(period_id uuid,room_type_id uuid);
CREATE TABLE availability_blocks(property_id uuid,room_id uuid,room_type_id uuid,status text,start_date date,end_date date);
