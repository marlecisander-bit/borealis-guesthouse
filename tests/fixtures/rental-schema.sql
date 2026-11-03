-- Minimal legacy-contract fixture for exercising the actual additive migration.
-- No Supabase connection, provider, real content or production credential.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TYPE public.admin_role AS ENUM ('owner','manager','editor','staff');
CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
CREATE TABLE public.experiences(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL,name text NOT NULL,slug text,pricing_type text DEFAULT 'fixed',currency text DEFAULT 'EUR',price numeric,availability_mode text DEFAULT 'always',max_capacity int,minimum_quantity int DEFAULT 1,maximum_quantity int,booking_cutoff_hours int DEFAULT 0,operating_days smallint[] DEFAULT '{0,1,2,3,4,5,6}',operating_start_time time,operating_end_time time,slot_interval_minutes int,active_date_start date,active_date_end date,status public.content_status DEFAULT 'published',active bool DEFAULT true,is_visible bool DEFAULT true,bookable bool DEFAULT true,book_independently bool DEFAULT true);
CREATE TABLE public.experience_availability(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,experience_id uuid,available_date date,start_time time,end_time time,slot_capacity int,max_bookings int,metadata jsonb DEFAULT '{}',availability_type text,status public.content_status DEFAULT 'published',active bool DEFAULT true,day_of_week smallint);
CREATE TABLE public.bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,check_in date,check_out date,status text,booking_status text DEFAULT 'held',adults int DEFAULT 1,children int DEFAULT 0,infants int,total_guests int,subtotal numeric DEFAULT 0,room_subtotal numeric DEFAULT 0,addons_subtotal numeric DEFAULT 0,taxes_fees numeric DEFAULT 0,total_amount numeric DEFAULT 0,discount_amount numeric DEFAULT 0,currency text DEFAULT 'EUR',payment_status text DEFAULT 'pending',payment_method text,notes text,source text,reference text,hold_expires_at timestamptz DEFAULT now()+interval '15 minutes',public_token uuid,updated_at timestamptz);
CREATE TABLE public.booking_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid REFERENCES public.bookings(id),property_id uuid,item_type text,item_id uuid,title_snapshot text,quantity int,unit_price numeric,total_price numeric,currency text,service_date date,service_time time,item_status text DEFAULT 'held',metadata jsonb DEFAULT '{}',created_at timestamptz DEFAULT now());
CREATE TABLE public.booking_guests(id uuid DEFAULT gen_random_uuid(),property_id uuid,booking_id uuid,first_name text,last_name text,email text,phone text,country text,is_primary bool);
CREATE TABLE public.test_memberships(user_id uuid,property_id uuid,role public.admin_role);
CREATE FUNCTION public.can_manage_property(target_property uuid,allowed_roles public.admin_role[] DEFAULT ARRAY['owner','manager','editor','staff']::public.admin_role[]) RETURNS bool LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM public.test_memberships m WHERE m.user_id=auth.uid() AND m.property_id=target_property AND m.role=ANY(allowed_roles)) $$;
CREATE FUNCTION public.next_booking_reference(uuid) RETURNS text LANGUAGE sql AS $$ SELECT 'TEST-'||gen_random_uuid()::text $$;
-- Stub only the established room allocator boundary, never the rental logic.
CREATE FUNCTION public.create_multi_room_booking_package_hold(room_data jsonb,stay_start date,stay_end date,guest_count int,guest_data jsonb,addon_data jsonb DEFAULT '[]')
RETURNS TABLE(booking_id uuid,hold_token uuid,reference text,expires_at timestamptz,total numeric,currency text) LANGUAGE plpgsql AS $$
DECLARE bid uuid:=gen_random_uuid(); token uuid:=gen_random_uuid();
BEGIN
 INSERT INTO public.bookings(id,property_id,check_in,check_out,adults,children,room_subtotal,subtotal,total_amount,public_token) VALUES(bid,(room_data->0->>'propertyId')::uuid,stay_start,stay_end,(guest_data->>'adults')::int,(guest_data->>'children')::int,100,100,100,token);
 RETURN QUERY SELECT bid,token,'TEST-ROOM',now()+interval '15 minutes',100::numeric,'EUR'::text;
END $$;

CREATE TABLE public.notifications(booking_id uuid,type text,message text,metadata jsonb DEFAULT '{}',updated_at timestamptz);
CREATE TABLE public.properties(id uuid PRIMARY KEY);
ALTER TABLE public.experiences ADD COLUMN description text,ADD COLUMN short_description text,ADD COLUMN full_description text,ADD COLUMN duration_label text,ADD COLUMN sort_order int DEFAULT 0;

-- Real last-published legacy guard and confirmation definitions, for drift checks.
CREATE OR REPLACE FUNCTION public.guard_experience_booking_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  experience_row public.experiences%ROWTYPE;
  booking_row public.bookings%ROWTYPE;
  matched_slot public.experience_availability%ROWTYPE;
  requested_quantity INTEGER;
  reserved_quantity INTEGER;
  effective_capacity INTEGER;
  weekday SMALLINT;
  is_closed BOOLEAN;
BEGIN
  IF NEW.item_type<>'experience' OR NEW.item_status='cancelled' THEN RETURN NEW; END IF;
  SELECT * INTO experience_row FROM public.experiences WHERE id=NEW.item_id;
  SELECT * INTO booking_row FROM public.bookings WHERE id=NEW.booking_id;
  IF experience_row.id IS NULL OR booking_row.id IS NULL OR experience_row.property_id<>booking_row.property_id
     OR experience_row.status<>'published' OR NOT experience_row.active OR NOT experience_row.is_visible OR NOT experience_row.bookable
     OR NEW.service_date IS NULL THEN
    RAISE EXCEPTION 'This experience is not available' USING ERRCODE='22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(experience_row.property_id::TEXT));
  requested_quantity:=COALESCE(NULLIF(NEW.metadata->>'requestedQuantity','')::INTEGER,NEW.quantity);
  weekday:=extract(dow FROM NEW.service_date)::SMALLINT;
  IF requested_quantity<experience_row.minimum_quantity
     OR (experience_row.maximum_quantity IS NOT NULL AND requested_quantity>experience_row.maximum_quantity)
     OR (experience_row.max_capacity IS NOT NULL AND requested_quantity>experience_row.max_capacity)
     OR NEW.service_date<CURRENT_DATE
     OR (experience_row.active_date_start IS NOT NULL AND NEW.service_date<experience_row.active_date_start)
     OR (experience_row.active_date_end IS NOT NULL AND NEW.service_date>experience_row.active_date_end)
     OR NOT weekday=ANY(experience_row.operating_days) THEN
    RAISE EXCEPTION 'The selected date or quantity is not available' USING ERRCODE='22023';
  END IF;

  IF experience_row.operating_start_time IS NOT NULL
     AND (NEW.service_time IS NULL OR NEW.service_time<experience_row.operating_start_time) THEN
    RAISE EXCEPTION 'Choose a valid experience time' USING ERRCODE='22023';
  END IF;
  IF experience_row.operating_end_time IS NOT NULL
     AND (NEW.service_time IS NULL OR NEW.service_time>=experience_row.operating_end_time) THEN
    RAISE EXCEPTION 'Choose a valid experience time' USING ERRCODE='22023';
  END IF;
  IF experience_row.slot_interval_minutes IS NOT NULL AND NEW.service_time IS NULL THEN
    RAISE EXCEPTION 'Choose an experience time slot' USING ERRCODE='22023';
  END IF;
  IF experience_row.slot_interval_minutes IS NOT NULL AND experience_row.operating_start_time IS NOT NULL
     AND mod(extract(epoch FROM (NEW.service_time-experience_row.operating_start_time))::INTEGER,
       experience_row.slot_interval_minutes*60)<>0 THEN
    RAISE EXCEPTION 'Choose a published experience time slot' USING ERRCODE='22023';
  END IF;
  IF NEW.service_date+COALESCE(NEW.service_time,'23:59'::TIME)
     < NOW()+make_interval(hours=>experience_row.booking_cutoff_hours) THEN
    RAISE EXCEPTION 'The booking cutoff for this experience has passed' USING ERRCODE='22023';
  END IF;

  SELECT COALESCE(bool_or(COALESCE((ea.metadata->>'closed')::BOOLEAN,FALSE)),FALSE)
  INTO is_closed
  FROM public.experience_availability ea
  WHERE ea.experience_id=experience_row.id
    AND ((ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=NEW.service_date)
      OR (ea.availability_type='recurring_day' AND ea.day_of_week=weekday))
    AND (ea.start_time IS NULL OR ea.start_time IS NOT DISTINCT FROM NEW.service_time);
  IF is_closed THEN RAISE EXCEPTION 'This experience is closed at the selected time' USING ERRCODE='22023'; END IF;

  SELECT ea.* INTO matched_slot
  FROM public.experience_availability ea
  WHERE ea.experience_id=experience_row.id AND ea.status='published' AND ea.active
    AND NOT COALESCE((ea.metadata->>'closed')::BOOLEAN,FALSE)
    AND ((ea.availability_type IN ('specific_date','time_slot') AND ea.available_date=NEW.service_date)
      OR (ea.availability_type='recurring_day' AND ea.day_of_week=weekday))
    AND (ea.start_time IS NULL OR ea.start_time IS NOT DISTINCT FROM NEW.service_time)
  ORDER BY (ea.available_date=NEW.service_date) DESC,(ea.start_time IS NOT NULL) DESC
  LIMIT 1;
  IF experience_row.availability_mode='specific_dates' AND matched_slot.id IS NULL THEN
    RAISE EXCEPTION 'This experience is not available on the selected date' USING ERRCODE='22023';
  END IF;

  effective_capacity:=COALESCE(matched_slot.slot_capacity,matched_slot.max_bookings,experience_row.max_capacity,99);
  SELECT COALESCE(sum(COALESCE(NULLIF(item.metadata->>'requestedQuantity','')::INTEGER,item.quantity)),0)::INTEGER
  INTO reserved_quantity
  FROM public.booking_items item
  JOIN public.bookings booking ON booking.id=item.booking_id
  WHERE item.item_type='experience' AND item.item_id=experience_row.id
    AND item.service_date=NEW.service_date
    AND item.service_time IS NOT DISTINCT FROM NEW.service_time
    AND item.id IS DISTINCT FROM NEW.id
    AND booking.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
    AND (booking.booking_status<>'held' OR booking.hold_expires_at>NOW());
  IF reserved_quantity+requested_quantity>effective_capacity THEN
    RAISE EXCEPTION 'This experience no longer has enough availability' USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.get_booking_confirmation_package(target_token UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('reference',b.reference,'status',b.booking_status,'paymentStatus',b.payment_status,'paymentMethod',b.payment_method,'guestName',trim(g.first_name||' '||g.last_name),'checkIn',b.check_in,'checkOut',b.check_out,'adults',b.adults,'children',b.children,'infants',b.infants,'totalGuests',b.total_guests,'roomSubtotal',b.room_subtotal,'addonsSubtotal',b.addons_subtotal,'taxes',b.taxes_fees,'discount',b.discount_amount,'total',b.total_amount,'currency',b.currency,'items',COALESCE((SELECT jsonb_agg(jsonb_build_object('type',item.item_type,'title',item.title_snapshot,'quantity',item.quantity,'unitPrice',item.unit_price,'subtotal',item.total_price,'currency',COALESCE(item.currency,b.currency),'date',item.service_date,'time',item.service_time,'status',item.item_status,'metadata',item.metadata) ORDER BY item.created_at,item.id) FROM public.booking_items item WHERE item.booking_id=b.id),'[]'::JSONB))
  FROM public.bookings b JOIN public.booking_guests g ON g.booking_id=b.id AND g.is_primary WHERE b.public_token=target_token AND b.booking_status<>'held' LIMIT 1;
$$;
