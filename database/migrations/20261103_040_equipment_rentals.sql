-- Additive equipment rentals. Apply only after the release checklist has been reviewed.
-- No catalogue seed, price update, content replacement or reservation rewrite runs here.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $migration_guard$ BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' THEN RAISE EXCEPTION 'Unexpected database or migration owner'; END IF;
 IF (SELECT md5(regexp_replace(prosrc,'\s','','g')) FROM pg_proc WHERE oid=to_regprocedure('public.guard_experience_booking_item()')) IS DISTINCT FROM '8fdb16da994267bebfde43a1757ea328' THEN RAISE EXCEPTION 'Legacy guard_experience_booking_item definition changed; review migration 040 before applying'; END IF;
 IF (SELECT md5(regexp_replace(prosrc,'\s','','g')) FROM pg_proc WHERE oid=to_regprocedure('public.get_booking_confirmation_package(uuid)')) IS DISTINCT FROM '734c04c13f4c9523cebb82bd78391958' THEN RAISE EXCEPTION 'Legacy get_booking_confirmation_package definition changed; review migration 040 before applying'; END IF;
END $migration_guard$;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS rental_config jsonb;
ALTER TABLE public.booking_items ADD COLUMN IF NOT EXISTS rental_snapshot jsonb;
CREATE TABLE public.rental_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_item_id uuid NOT NULL REFERENCES public.booking_items(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES public.experiences(id),
  unit_key text NOT NULL,
  reserved_interval tstzrange NOT NULL,
  UNIQUE(booking_item_id,unit_key)
);
CREATE INDEX rental_allocation_lookup ON public.rental_allocations(experience_id,unit_key);
ALTER TABLE public.rental_allocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_allocations FROM PUBLIC,anon,authenticated;

-- Shared by both hold entry points and the insert guard. Only this trusted
-- implementation chooses equipment, calculates totals and builds snapshots.
CREATE FUNCTION public.rental_quote_internal(selection jsonb, context text DEFAULT 'standalone')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE
 e public.experiences%ROWTYPE; c jsonb; o jsonb; d date; start_at time; end_at time;
 opens time; closes time; mode text; hours integer; qty integer; adults integer; children integer;
 begins timestamptz; ends timestamptz; reserved_until timestamptz; keys jsonb; unit_price numeric;
 subtotal numeric; extras numeric:=0; charge jsonb; separate jsonb:='[]'; advance numeric:=0;
 method text; people integer; today date:=(now() AT TIME ZONE 'Europe/Tirane')::date;
BEGIN
 IF context NOT IN ('standalone','room') THEN RAISE EXCEPTION 'Invalid rental context'; END IF;
 SELECT * INTO e FROM public.experiences WHERE id=(selection->>'experienceId')::uuid
   AND status='published' AND is_visible AND active AND bookable;
 c:=e.rental_config;
 IF c IS NULL OR c->>'version' IS DISTINCT FROM '1' OR NOT COALESCE((c->>'occupancyReviewed')::boolean,false)
    OR NOT COALESCE((c->>CASE context WHEN 'room' THEN 'roomAddon' ELSE 'standalone' END)::boolean,false)
 THEN RAISE EXCEPTION 'This rental is not enabled' USING ERRCODE='22023'; END IF;
 d:=(selection->>'date')::date; start_at:=(selection->>'startTime')::time; mode:=selection->>'mode';
 hours:=(selection->>'hours')::integer; qty:=(selection->>'quantity')::integer;
 adults:=(selection->>'adults')::integer; children:=(selection->>'children')::integer; people:=adults+children;
 method:=selection->>'paymentMethod';
 IF d IS NULL OR start_at IS NULL OR qty IS NULL OR qty NOT BETWEEN 1 AND 100 OR adults IS NULL OR adults<1 OR children IS NULL OR children<0
   OR hours IS NULL OR hours NOT BETWEEN 1 AND 24 OR d<today
   OR mode IS NULL OR NOT c->'modes' ? mode OR NOT c->'paymentMethods' ? COALESCE(method,'')
   OR method='online' THEN RAISE EXCEPTION 'Invalid rental selection or unavailable payment option' USING ERRCODE='22023'; END IF;
 IF c->>'peoplePerItem' IS NULL OR people>qty*(c->>'peoplePerItem')::integer
   OR (c->>'maxAdultsPerItem' IS NOT NULL AND adults>qty*(c->>'maxAdultsPerItem')::integer)
   OR (c->>'maxChildrenPerItem' IS NOT NULL AND children>qty*(c->>'maxChildrenPerItem')::integer)
   OR adults<qty*(c->>'minAdultsPerItem')::integer
 THEN RAISE EXCEPTION 'Participants exceed the equipment occupancy rules' USING ERRCODE='22023'; END IF;
 IF c->>'minAge' IS NOT NULL AND (jsonb_array_length(COALESCE(selection->'participantAges','[]'))<>people OR EXISTS(
   SELECT 1 FROM jsonb_array_elements_text(selection->'participantAges') a WHERE a::numeric<(c->>'minAge')::numeric OR a::numeric>120))
 THEN RAISE EXCEPTION 'Age details do not meet the safety rules' USING ERRCODE='22023'; END IF;
 IF c->>'maxWeightKg' IS NOT NULL AND (jsonb_array_length(COALESCE(selection->'participantWeightsKg','[]'))<>people OR EXISTS(
   SELECT 1 FROM jsonb_array_elements_text(selection->'participantWeightsKg') w WHERE w::numeric<=0 OR w::numeric>(c->>'maxWeightKg')::numeric))
 THEN RAISE EXCEPTION 'Weight details do not meet the safety rules' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c->'overrides') x WHERE d BETWEEN (x->>'from')::date AND (x->>'to')::date AND (x->>'closed')::boolean)
 THEN RAISE EXCEPTION 'This rental is closed on the selected date'; END IF;
 SELECT x INTO o FROM jsonb_array_elements(c->'overrides') x WHERE d BETWEEN (x->>'from')::date AND (x->>'to')::date AND NOT (x->>'closed')::boolean ORDER BY x->>'from' DESC LIMIT 1;
 IF o IS NULL AND NOT c->'days' @> jsonb_build_array(extract(dow FROM d)::integer) THEN RAISE EXCEPTION 'This rental does not operate on this day'; END IF;
 IF e.active_date_start IS NOT NULL AND d<e.active_date_start OR e.active_date_end IS NOT NULL AND d>e.active_date_end THEN RAISE EXCEPTION 'Outside the active season'; END IF;
 IF c->>'kind'='boat' AND (o IS NULL OR NOT COALESCE((o->>'daylightReviewed')::boolean,false)) THEN RAISE EXCEPTION 'Boat daylight hours need owner review for this date'; END IF;
 opens:=COALESCE(o->>'open',c->>'open')::time; closes:=COALESCE(o->>'close',c->>'close')::time;
 IF mode='daily' THEN
   IF NOT COALESCE((c->>'dailyHoursReviewed')::boolean,false) OR c->>'dailyPrice' IS NULL THEN RAISE EXCEPTION 'Daily rental needs owner review'; END IF;
   IF start_at<>(c->>'dailyStart')::time THEN RAISE EXCEPTION 'Choose the daily collection time'; END IF;
   end_at:=(c->>'dailyEnd')::time; unit_price:=(c->>'dailyPrice')::numeric;
 ELSE
   IF mode<>'hourly' OR hours<(c->>'minHours')::integer OR hours>(c->>'maxHours')::integer
      OR mod(hours-(c->>'minHours')::integer,(c->>'incrementHours')::integer)<>0
      OR extract(minute FROM start_at)<>0 OR extract(second FROM start_at)<>0 OR c->>'hourlyPrice' IS NULL
   THEN RAISE EXCEPTION 'Choose a valid whole-hour rental'; END IF;
   IF extract(epoch FROM start_at)+hours*3600>=86400 THEN RAISE EXCEPTION 'Overnight rentals are unavailable'; END IF;
   end_at:=start_at+make_interval(hours=>hours); unit_price:=(c->>'hourlyPrice')::numeric*hours;
 END IF;
 IF opens IS NULL OR closes IS NULL OR start_at<opens OR end_at>closes OR end_at<=start_at THEN RAISE EXCEPTION 'Rental must finish within operating hours'; END IF;
 begins:=(d+start_at) AT TIME ZONE 'Europe/Tirane'; ends:=(d+end_at) AT TIME ZONE 'Europe/Tirane';
 reserved_until:=ends+make_interval(mins=>(c->>'bufferMinutes')::integer);
 IF begins<now()+make_interval(hours=>(c->>'cutoffHours')::integer) THEN RAISE EXCEPTION 'The booking cutoff has passed'; END IF;
 IF EXISTS(SELECT 1 FROM public.experience_availability a WHERE a.experience_id=e.id
   AND COALESCE((a.metadata->>'closed')::boolean,false)
   AND (a.available_date=d OR a.availability_type='recurring_day' AND a.day_of_week=extract(dow FROM d))
   AND (a.start_time IS NULL OR tsrange(d+a.start_time,d+COALESCE(a.end_time,'23:59:59'::time),'[)')&&tsrange(d+start_at,d+end_at,'[)')))
 THEN RAISE EXCEPTION 'This experience is closed for the requested interval'; END IF;
 SELECT COALESCE(jsonb_agg(u->>'key' ORDER BY u->>'key'),'[]') INTO keys
 FROM jsonb_array_elements(c->'units') u
 WHERE (u->>'active')::boolean AND (u->>'verified')::boolean
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'maintenance') m WHERE m->>'unitKey'=u->>'key'
   AND EXISTS(SELECT 1 FROM generate_series(d::timestamp,(reserved_until AT TIME ZONE 'Europe/Tirane')::date::timestamp,interval '1 day') md WHERE md::date BETWEEN (m->>'from')::date AND (m->>'to')::date AND tsrange(md::date+(m->>'start')::time,md::date+(m->>'end')::time,'[)')&&tsrange(d+start_at,(reserved_until AT TIME ZONE 'Europe/Tirane'),'[)')))
 AND NOT EXISTS(SELECT 1 FROM public.rental_allocations a JOIN public.booking_items i ON i.id=a.booking_item_id JOIN public.bookings b ON b.id=i.booking_id
   WHERE a.experience_id=e.id AND a.unit_key=u->>'key' AND a.reserved_interval&&tstzrange(begins,reserved_until,'[)')
   AND i.item_status<>'cancelled' AND b.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
   AND (b.booking_status<>'held' OR b.hold_expires_at>now()));
 IF jsonb_array_length(keys)<qty THEN RAISE EXCEPTION 'Not enough equipment remains for this interval' USING ERRCODE='23P01'; END IF;
 subtotal:=unit_price*qty;
 FOR charge IN SELECT value FROM jsonb_array_elements(c->'extraCharges') LOOP
   IF charge->'modes' ? mode THEN
     IF charge->>'collection'='return' THEN separate:=separate||jsonb_build_array((charge->>'label')||': '||(charge->>'amount')||' '||e.currency||' / '||(charge->>'basis'));
     ELSE extras:=extras+(charge->>'amount')::numeric*CASE charge->>'basis' WHEN 'equipment' THEN qty WHEN 'person' THEN people ELSE 1 END; END IF;
   END IF;
 END LOOP;
 IF c->>'fuel'='excluded' THEN separate:=separate||jsonb_build_array(c->>'fuelExplanation'); END IF;
 -- A room package establishes staying status. Standalone does not prove
 -- non-staying status, so entry eligibility must be verified before collection.
 IF context='standalone' THEN
   IF c->>'beachApplicability' IN ('non_staying_all','non_staying_adults') THEN
     separate:=separate||jsonb_build_array('Beach entry for non-staying renters: '||(c->>'beachFee')||' '||e.currency||CASE WHEN c->>'beachApplicability'='non_staying_adults' THEN ' / adult' ELSE ' / person' END||'. Staff must verify stay status before collection; not included in this quote.');
   ELSIF c->>'beachApplicability'='unresolved' THEN separate:=separate||jsonb_build_array('Beach entry applicability requires confirmation; no entry fee collected.'); END IF;
 END IF;
 IF method='advance' THEN
   advance:=CASE c->>'advanceType' WHEN 'percent' THEN round((subtotal+extras)*(c->>'advanceValue')::numeric/100,2) WHEN 'amount' THEN LEAST(subtotal+extras,(c->>'advanceValue')::numeric) ELSE NULL END;
   IF advance IS NULL OR advance<=0 OR nullif(c->>'balanceRule','') IS NULL THEN RAISE EXCEPTION 'Advance payment instructions are unavailable'; END IF;
 END IF;
 RETURN jsonb_build_object('total',round(subtotal+extras,2),'rentalSubtotal',subtotal,'extrasSubtotal',extras,'unitPrice',unit_price,'currency',e.currency,'mode',mode,'hours',extract(epoch FROM (end_at-start_at))/3600,
   'startTime',to_char(start_at,'HH24:MI'),'endTime',to_char(end_at,'HH24:MI'),'date',d,'quantity',qty,'adults',adults,'children',children,'remaining',jsonb_array_length(keys),
   'fuelExplanation',CASE WHEN c->>'fuel'='excluded' THEN c->>'fuelExplanation' ELSE '' END,'separatelyPayable',separate,'policies',c->'policies','extraCharges',c->'extraCharges',
   'paymentMethod',method,'paymentStatus','pending','advanceDue',advance,'balanceDue',round(subtotal+extras-advance,2),'balanceRule',c->>'balanceRule',
   'priceVersion',md5(c::text),'unitKeys',keys,'begins',begins,'reservedUntil',reserved_until,'unitLabel',c->>'unitLabel');
END $$;
REVOKE ALL ON FUNCTION public.rental_quote_internal(jsonb,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.quote_equipment_rental(selection jsonb, booking_context text DEFAULT 'standalone')
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.rental_quote_internal(selection,booking_context)-'unitKeys'-'begins'-'reservedUntil';
$$;
REVOKE ALL ON FUNCTION public.quote_equipment_rental(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quote_equipment_rental(jsonb,text) TO anon,authenticated;

-- Configuration writes and every inventory-creating request use the same
-- property lock as room allocation. Internal unit identities never leave SQL.
CREATE FUNCTION public.guard_rental_configuration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c jsonb:=NEW.rental_config; u jsonb;
BEGIN
 IF c IS NOT NULL AND NEW.status='published' AND (NOT COALESCE((c->>'occupancyReviewed')::bool,false) OR c->>'peoplePerItem' IS NULL) THEN RAISE EXCEPTION 'Verify rental occupancy before publishing'; END IF;
 IF c IS NOT DISTINCT FROM OLD.rental_config AND TG_OP='UPDATE' THEN RETURN NEW; END IF;
 IF c IS NULL THEN
   IF TG_OP='UPDATE' AND OLD.rental_config IS NOT NULL THEN RAISE EXCEPTION 'Archive rental products instead of removing their inventory model'; END IF;
   RETURN NEW;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));
 IF TG_OP='UPDATE' AND OLD.rental_config IS NULL AND EXISTS(SELECT 1 FROM public.booking_items i JOIN public.bookings b ON b.id=i.booking_id WHERE i.item_id=NEW.id AND i.item_type='experience' AND i.service_date>=(now() AT TIME ZONE 'Europe/Tirane')::date AND i.item_status<>'cancelled' AND b.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in') AND (b.booking_status<>'held' OR b.hold_expires_at>now()))
 THEN RAISE EXCEPTION 'Resolve future legacy reservations before converting this product to equipment inventory'; END IF;
 -- Validate JSON at the database boundary as well as the authenticated form.
 IF jsonb_typeof(c)<>'object' OR NOT c ?& ARRAY['version','kind','category','unitLabel','units','peoplePerItem','maxAdultsPerItem','maxChildrenPerItem','minAdultsPerItem','minAge','maxWeightKg','occupancyReviewed','modes','hourlyPrice','dailyPrice','minHours','maxHours','incrementHours','days','open','close','dailyStart','dailyEnd','dailyHoursReviewed','cutoffHours','bufferMinutes','overrides','maintenance','roomAddon','standalone','fuel','fuelExplanation','policies','paymentMethods','advanceType','advanceValue','balanceRule','beachFee','beachApplicability','extraCharges'] THEN RAISE EXCEPTION 'Incomplete rental configuration'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['occupancyReviewed','dailyHoursReviewed','roomAddon','standalone']) k WHERE jsonb_typeof(c->k)<>'boolean')
 OR COALESCE(c->>'kind','') NOT IN ('boat','sup','single_kayak','double_kayak','other') OR nullif(trim(c->>'category'),'') IS NULL OR nullif(trim(c->>'unitLabel'),'') IS NULL
 OR COALESCE(c->>'fuel','') NOT IN ('excluded','included','not_applicable') OR COALESCE(c->>'beachApplicability','') NOT IN ('unresolved','none','non_staying_all','non_staying_adults')
 OR EXISTS(SELECT 1 FROM unnest(ARRAY['units','modes','days','overrides','maintenance','paymentMethods','extraCharges']) k WHERE jsonb_typeof(c->k)<>'array')
 OR EXISTS(SELECT 1 FROM unnest(ARRAY['minHours','maxHours','incrementHours','cutoffHours','bufferMinutes','minAdultsPerItem']) k WHERE COALESCE(c->>k,'')!~'^\d+$')
 OR EXISTS(SELECT 1 FROM unnest(ARRAY['peoplePerItem','maxAdultsPerItem','maxChildrenPerItem','minAge']) k WHERE c->k<>'null'::jsonb AND (COALESCE(c->>k,'')!~'^\d+$' OR (c->>k)::numeric>100))
 OR EXISTS(SELECT 1 FROM unnest(ARRAY['hourlyPrice','dailyPrice','advanceValue','beachFee']) k WHERE c->k<>'null'::jsonb AND (jsonb_typeof(c->k)<>'number' OR (c->>k)::numeric<0 OR (c->>k)::numeric>1000000 OR (c->>k)::numeric<>round((c->>k)::numeric,2)))
 OR c->>'beachFee' IS NULL OR (c->>'cutoffHours')::int>8760 OR (c->>'incrementHours')::int>24 OR (c->>'minAdultsPerItem')::int>100
 OR (c->>'maxWeightKg' IS NOT NULL AND ((c->>'maxWeightKg')::numeric<=0 OR (c->>'maxWeightKg')::numeric>500))
 THEN RAISE EXCEPTION 'Invalid rental settings or limits'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(c->'modes') m WHERE m NOT IN ('hourly','daily')) OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(c->'paymentMethods') m WHERE m NOT IN ('cash','pos','advance'))
 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(c->'days') d WHERE d!~'^[0-6]$') OR jsonb_array_length(c->'overrides')>366 OR jsonb_array_length(c->'maintenance')>1000 OR jsonb_array_length(c->'extraCharges')>30
 OR jsonb_typeof(c->'policies')<>'object' OR EXISTS(SELECT 1 FROM unnest(ARRAY['safety','included','excluded','meetingPoint','collection','return','cancellation','weather','lateReturn','damageDeposit']) k WHERE jsonb_typeof(c->'policies'->k) IS DISTINCT FROM 'string' OR length(c->'policies'->>k)>10000)
 THEN RAISE EXCEPTION 'Invalid rental modes, schedule or policies'; END IF;
 FOR u IN SELECT value FROM jsonb_array_elements(c->'units') LOOP
  IF NOT u ?& ARRAY['key','label','active','verified'] OR COALESCE(u->>'key','')!~'^[-A-Za-z0-9_]{1,64}$' OR nullif(trim(u->>'label'),'') IS NULL OR jsonb_typeof(u->'active')<>'boolean' OR jsonb_typeof(u->'verified')<>'boolean' THEN RAISE EXCEPTION 'Invalid equipment'; END IF;
 END LOOP;
 FOR u IN SELECT value FROM jsonb_array_elements(c->'overrides') LOOP
  IF NOT u ?& ARRAY['from','to','open','close','closed','daylightReviewed'] OR (u->>'to')::date<(u->>'from')::date OR (u->>'close')::time<=(u->>'open')::time OR jsonb_typeof(u->'closed')<>'boolean' OR jsonb_typeof(u->'daylightReviewed')<>'boolean' THEN RAISE EXCEPTION 'Invalid date override'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c->'overrides') WITH ORDINALITY a(x,i),jsonb_array_elements(c->'overrides') WITH ORDINALITY b(x,i) WHERE a.i<b.i AND NOT (a.x->>'closed')::bool AND NOT (b.x->>'closed')::bool AND daterange((a.x->>'from')::date,(a.x->>'to')::date,'[]')&&daterange((b.x->>'from')::date,(b.x->>'to')::date,'[]')) THEN RAISE EXCEPTION 'Overlapping open date overrides'; END IF;
 FOR u IN SELECT value FROM jsonb_array_elements(c->'maintenance') LOOP
  IF NOT u ?& ARRAY['unitKey','from','to','start','end'] OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'units') v WHERE v->>'key'=u->>'unitKey') OR (u->>'to')::date<(u->>'from')::date OR (u->>'end')::time<=(u->>'start')::time THEN RAISE EXCEPTION 'Invalid maintenance block'; END IF;
 END LOOP;
 FOR u IN SELECT value FROM jsonb_array_elements(c->'extraCharges') LOOP
  IF NOT u ?& ARRAY['label','amount','basis','collection','modes'] OR nullif(trim(u->>'label'),'') IS NULL OR jsonb_typeof(u->'amount')<>'number' OR (u->>'amount')::numeric NOT BETWEEN 0 AND 1000000 OR (u->>'amount')::numeric<>round((u->>'amount')::numeric,2) OR COALESCE(u->>'basis','') NOT IN ('equipment','person','booking') OR COALESCE(u->>'collection','') NOT IN ('booking','return') OR jsonb_typeof(u->'modes')<>'array' OR jsonb_array_length(u->'modes')=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(u->'modes') m WHERE m NOT IN ('hourly','daily')) THEN RAISE EXCEPTION 'Invalid extra charge'; END IF;
 END LOOP;
 IF c->'paymentMethods' ? 'advance' AND (COALESCE(c->>'advanceType','') NOT IN ('amount','percent') OR COALESCE((c->>'advanceValue')::numeric,0)<=0 OR (c->>'advanceType'='percent' AND (c->>'advanceValue')::numeric>100) OR nullif(trim(c->>'balanceRule'),'') IS NULL) THEN RAISE EXCEPTION 'Advance payment instructions are incomplete'; END IF;
 IF (c->>'roomAddon')::boolean OR (c->>'standalone')::boolean THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'units') v WHERE (v->>'active')::bool AND (v->>'verified')::bool) OR c->'days'='[]' OR EXISTS(SELECT 1 FROM unnest(ARRAY['safety','meetingPoint','collection','return','cancellation','weather']) k WHERE nullif(trim(c->'policies'->>k),'') IS NULL) THEN RAISE EXCEPTION 'Review equipment and safety instructions before enabling rentals'; END IF;
  IF c->'modes' ? 'daily' AND ((c->>'dailyStart')::time<(c->>'open')::time OR (c->>'dailyEnd')::time>(c->>'close')::time) THEN RAISE EXCEPTION 'Daily collection and return must fit operating hours'; END IF;
  IF c->>'kind'='boat' AND (c->>'fuel'='not_applicable' OR nullif(trim(c->>'fuelExplanation'),'') IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'overrides') v WHERE NOT (v->>'closed')::bool AND (v->>'daylightReviewed')::bool)) THEN RAISE EXCEPTION 'Review boat fuel and seasonal daylight hours'; END IF;
 END IF;
 IF c->>'version' IS DISTINCT FROM '1' OR jsonb_typeof(c->'units')<>'array' OR jsonb_array_length(c->'units')>100
  OR (SELECT count(*)<>count(DISTINCT x->>'key') FROM jsonb_array_elements(c->'units') x)
  OR jsonb_typeof(c->'modes')<>'array' OR c->'modes'='[]' OR (c->>'minHours')::int<1 OR (c->>'maxHours')::int>24 OR (c->>'maxHours')::int<(c->>'minHours')::int OR (c->>'incrementHours')::int<1
  OR (c->>'bufferMinutes')::int NOT BETWEEN 0 AND 1440 OR (c->>'cutoffHours')::int<0
  OR (c->>'open')::time>=(c->>'close')::time OR (c->>'dailyStart')::time>=(c->>'dailyEnd')::time
  OR (c->>'minAdultsPerItem')::int<0 OR COALESCE((c->>'peoplePerItem')::int,1)<1
  OR COALESCE((c->>'hourlyPrice')::numeric,0)<0 OR COALESCE((c->>'dailyPrice')::numeric,0)<0
 THEN RAISE EXCEPTION 'Invalid rental configuration'; END IF;
 IF c->'paymentMethods' ? 'online' THEN RAISE EXCEPTION 'Online payments require a verified provider integration'; END IF;
 FOR u IN SELECT value FROM jsonb_array_elements(c->'units') LOOP
   IF nullif(u->>'key','') IS NULL OR (u->>'active')::boolean AND NOT (u->>'verified')::boolean THEN RAISE EXCEPTION 'Unverified units must remain inactive'; END IF;
 END LOOP;
 IF (c->>'roomAddon')::boolean OR (c->>'standalone')::boolean THEN
   IF NOT (c->>'occupancyReviewed')::boolean OR c->>'peoplePerItem' IS NULL OR c->'paymentMethods'='[]'
    OR (c->'modes' ? 'hourly' AND c->>'hourlyPrice' IS NULL)
    OR (c->'modes' ? 'daily' AND (c->>'dailyPrice' IS NULL OR NOT (c->>'dailyHoursReviewed')::boolean))
   THEN RAISE EXCEPTION 'Review occupancy, prices, daily hours and payments before enabling rentals'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_rental_configuration BEFORE INSERT OR UPDATE OF rental_config,status ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.guard_rental_configuration();

CREATE FUNCTION public.guard_rental_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.experiences%ROWTYPE; b public.bookings%ROWTYPE; q jsonb; selection jsonb; context text;
BEGIN
 IF TG_OP='UPDATE' AND OLD.rental_snapshot IS NOT NULL AND (NEW.item_type IS DISTINCT FROM OLD.item_type OR NEW.item_id IS DISTINCT FROM OLD.item_id OR NEW.rental_snapshot IS DISTINCT FROM OLD.rental_snapshot) THEN RAISE EXCEPTION 'Booked rentals are immutable'; END IF;
 IF NEW.item_type<>'experience' THEN RETURN NEW; END IF;
 SELECT * INTO e FROM public.experiences WHERE id=NEW.item_id;
 IF e.rental_config IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=NEW.booking_id;
 IF b.property_id IS DISTINCT FROM e.property_id OR NEW.property_id IS DISTINCT FROM e.property_id THEN RAISE EXCEPTION 'Invalid rental property'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(e.property_id::text));
 IF TG_OP='UPDATE' THEN
   IF NEW.item_id IS DISTINCT FROM OLD.item_id OR NEW.booking_id IS DISTINCT FROM OLD.booking_id OR NEW.rental_snapshot IS DISTINCT FROM OLD.rental_snapshot OR NEW.service_date IS DISTINCT FROM OLD.service_date OR NEW.service_time IS DISTINCT FROM OLD.service_time OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.total_price IS DISTINCT FROM OLD.total_price OR NEW.unit_price IS DISTINCT FROM OLD.unit_price OR NEW.currency IS DISTINCT FROM OLD.currency OR NEW.metadata IS DISTINCT FROM OLD.metadata THEN RAISE EXCEPTION 'Booked rentals are immutable; cancel and rebook to change equipment or prices'; END IF;
   IF OLD.item_status='cancelled' THEN NEW.item_status:='cancelled'; END IF;
   RETURN NEW;
 END IF;
 context:=CASE WHEN b.check_in IS NULL THEN 'standalone' ELSE 'room' END;
 selection:=NEW.metadata->'rentalSelection';
 IF selection IS NULL OR selection->>'experienceId' IS DISTINCT FROM e.id::text THEN RAISE EXCEPTION 'Equipment rentals require a complete rental selection'; END IF;
 IF context='standalone' AND NOT e.book_independently THEN RAISE EXCEPTION 'Standalone booking is disabled'; END IF;
 IF context='room' AND ((selection->>'date')::date<b.check_in OR (selection->>'date')::date>=b.check_out OR (selection->>'adults')::int>b.adults OR (selection->>'children')::int>b.children) THEN RAISE EXCEPTION 'Rental participants and date must fit the room stay'; END IF;
 q:=public.rental_quote_internal(selection,context);
 IF q->>'currency' IS DISTINCT FROM b.currency::text THEN RAISE EXCEPTION 'Rental and booking currencies must match'; END IF;
 NEW.quantity:=(q->>'quantity')::int; NEW.unit_price:=(q->>'unitPrice')::numeric; NEW.total_price:=(q->>'total')::numeric; NEW.currency:=q->>'currency';
 NEW.service_date:=(selection->>'date')::date; NEW.service_time:=(q->>'startTime')::time; NEW.title_snapshot:=e.name;
 NEW.rental_snapshot:=q-'unitKeys'-'begins'-'reservedUntil';
 NEW.metadata:=jsonb_build_object('requestedQuantity',(q->>'adults')::int+(q->>'children')::int,'rental',NEW.rental_snapshot,'allocatedUnits',(SELECT jsonb_agg(x) FROM (SELECT value FROM jsonb_array_elements(q->'unitKeys') LIMIT NEW.quantity) k(x)),'reservedFrom',q->'begins','reservedUntil',q->'reservedUntil');
 RETURN NEW;
END $$;
CREATE TRIGGER a_guard_rental_item BEFORE INSERT OR UPDATE ON public.booking_items FOR EACH ROW EXECUTE FUNCTION public.guard_rental_item();
CREATE FUNCTION public.allocate_rental_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.rental_snapshot IS NOT NULL THEN
 INSERT INTO public.rental_allocations(booking_item_id,experience_id,unit_key,reserved_interval)
 SELECT NEW.id,NEW.item_id,k,tstzrange((NEW.metadata->>'reservedFrom')::timestamptz,(NEW.metadata->>'reservedUntil')::timestamptz,'[)') FROM jsonb_array_elements_text(NEW.metadata->'allocatedUnits') k;
 -- Public confirmation metadata contains the commercial snapshot, never unit keys.
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER allocate_rental_item AFTER INSERT ON public.booking_items FOR EACH ROW EXECUTE FUNCTION public.allocate_rental_item();

-- Preserve the legacy non-rental guard verbatim apart from the rental dispatch.
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
  -- Rentals have already passed a_guard_rental_item; legacy capacity semantics remain unchanged.
  IF EXISTS(SELECT 1 FROM public.experiences WHERE id=NEW.item_id AND rental_config IS NOT NULL) THEN RETURN NEW; END IF;
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

CREATE FUNCTION public.create_equipment_rental_hold(selection jsonb,guest_data jsonb)
RETURNS TABLE(booking_id uuid,hold_token uuid,reference text,expires_at timestamptz,total numeric,currency text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.experiences%ROWTYPE; q jsonb; bid uuid:=gen_random_uuid(); token uuid:=gen_random_uuid(); ref text; expiry timestamptz:=now()+interval '15 minutes';
BEGIN
 IF trim(COALESCE(guest_data->>'firstName',''))='' OR trim(COALESCE(guest_data->>'lastName',''))='' OR trim(COALESCE(guest_data->>'phone',''))='' OR COALESCE(guest_data->>'email','')!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Valid guest contact details are required'; END IF;
 SELECT * INTO e FROM public.experiences WHERE id=(selection->>'experienceId')::uuid;
 IF e.id IS NULL OR NOT e.book_independently THEN RAISE EXCEPTION 'Standalone rental unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(e.property_id::text));
 q:=public.rental_quote_internal(selection,'standalone'); ref:=public.next_booking_reference(e.property_id);
 INSERT INTO public.bookings(id,property_id,check_in,check_out,status,booking_status,adults,children,infants,total_guests,subtotal,room_subtotal,addons_subtotal,taxes_fees,total_amount,currency,payment_status,payment_method,notes,source,reference,hold_expires_at,public_token)
 VALUES(bid,e.property_id,NULL,NULL,'pending','held',(q->>'adults')::int,(q->>'children')::int,0,(q->>'adults')::int+(q->>'children')::int,(q->>'total')::numeric,0,(q->>'total')::numeric,0,(q->>'total')::numeric,q->>'currency','pending',q->>'paymentMethod',nullif(guest_data->>'notes',''),'direct',ref,expiry,token);
 INSERT INTO public.booking_guests(property_id,booking_id,first_name,last_name,email,phone,country,is_primary)
 VALUES(e.property_id,bid,trim(guest_data->>'firstName'),trim(guest_data->>'lastName'),lower(trim(guest_data->>'email')),trim(guest_data->>'phone'),nullif(guest_data->>'country',''),true);
 INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,total_price,currency,service_date,service_time,item_status,metadata)
 VALUES(bid,e.property_id,'experience',e.id,e.name,1,0,0,e.currency,(selection->>'date')::date,(selection->>'startTime')::time,'held',jsonb_build_object('rentalSelection',selection));
 RETURN QUERY SELECT bid,token,ref,expiry,(q->>'total')::numeric,e.currency::text;
END $$;
REVOKE ALL ON FUNCTION public.create_equipment_rental_hold(jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_equipment_rental_hold(jsonb,jsonb) TO anon,authenticated;

-- All existing room/transfer/dinner operations remain inside the established
-- multi-room allocator transaction. Rental additions use the same item guard.
CREATE FUNCTION public.create_rental_room_package_hold(room_data jsonb,stay_start date,stay_end date,guest_count integer,guest_data jsonb,addon_data jsonb DEFAULT '[]')
RETURNS TABLE(booking_id uuid,hold_token uuid,reference text,expires_at timestamptz,total numeric,currency text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE h record; a jsonb; e public.experiences%ROWTYPE; b public.bookings%ROWTYPE; legacy jsonb; amount numeric; rental_total numeric:=0;
BEGIN
 IF jsonb_typeof(addon_data)<>'array' OR jsonb_array_length(addon_data)>30 THEN RAISE EXCEPTION 'Invalid add-ons'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(addon_data) x GROUP BY x->>'type',x->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate add-on'; END IF;
 SELECT COALESCE(jsonb_agg(x),'[]') INTO legacy FROM jsonb_array_elements(addon_data) x WHERE NOT x ? 'rentalSelection';
 SELECT * INTO h FROM public.create_multi_room_booking_package_hold(room_data,stay_start,stay_end,guest_count,guest_data,legacy);
 SELECT * INTO b FROM public.bookings WHERE id=h.booking_id;
 PERFORM pg_advisory_xact_lock(hashtext(b.property_id::text));
 FOR a IN SELECT value FROM jsonb_array_elements(addon_data) WHERE value ? 'rentalSelection' ORDER BY value->>'id' LOOP
   SELECT * INTO e FROM public.experiences WHERE id=(a->>'id')::uuid AND property_id=b.property_id;
   IF a->>'type'<>'experience' OR e.rental_config IS NULL OR a->'rentalSelection'->>'experienceId' IS DISTINCT FROM e.id::text THEN RAISE EXCEPTION 'Invalid rental add-on'; END IF;
   INSERT INTO public.booking_items(booking_id,property_id,item_type,item_id,title_snapshot,quantity,unit_price,total_price,currency,service_date,service_time,item_status,metadata)
   VALUES(b.id,b.property_id,'experience',e.id,e.name,1,0,0,b.currency,(a->'rentalSelection'->>'date')::date,(a->'rentalSelection'->>'startTime')::time,'held',jsonb_build_object('rentalSelection',a->'rentalSelection')) RETURNING total_price INTO amount;
   rental_total:=rental_total+amount;
 END LOOP;
 UPDATE public.bookings SET addons_subtotal=addons_subtotal+rental_total,subtotal=subtotal+rental_total,total_amount=total_amount+rental_total WHERE id=b.id;
 RETURN QUERY SELECT h.booking_id,h.hold_token,h.reference,h.expires_at,h.total+rental_total,h.currency;
END $$;
REVOKE ALL ON FUNCTION public.create_rental_room_package_hold(jsonb,date,date,integer,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_rental_room_package_hold(jsonb,date,date,integer,jsonb,jsonb) TO anon,authenticated;

-- Staff record money actually received; guest payment preference is not evidence.
CREATE TABLE public.rental_payment_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL REFERENCES public.bookings(id),
 property_id uuid NOT NULL,amount numeric(12,2) NOT NULL CHECK(amount>0),currency text NOT NULL,
 method text NOT NULL CHECK(method IN ('cash','pos','advance')),reference text NOT NULL CHECK(length(trim(reference))>0),
 recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now(), UNIQUE(booking_id,reference)
);
ALTER TABLE public.rental_payment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_payment_receipts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.rental_payment_receipts TO service_role;
CREATE FUNCTION public.rental_payment_balance(target_booking uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings%ROWTYPE; paid numeric; receipts jsonb;
BEGIN
 SELECT * INTO b FROM public.bookings WHERE id=target_booking;
 IF b.id IS NULL OR auth.uid() IS NULL OR NOT public.can_manage_property(b.property_id,ARRAY['owner','manager','staff']::public.admin_role[]) THEN RAISE EXCEPTION 'Payment access denied' USING ERRCODE='42501'; END IF;
 SELECT COALESCE(sum(r.amount),0),COALESCE(jsonb_agg(jsonb_build_object('amount',r.amount,'method',r.method,'reference',r.reference,'recordedAt',r.recorded_at) ORDER BY r.recorded_at),'[]') INTO paid,receipts FROM public.rental_payment_receipts r WHERE r.booking_id=b.id;
 RETURN jsonb_build_object('paid',paid,'balance',GREATEST(0,b.total_amount-paid),'currency',b.currency,'receipts',receipts);
END $$;
CREATE FUNCTION public.record_rental_payment(target_booking uuid,received_amount numeric,received_method text,receipt_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings%ROWTYPE; paid numeric;
BEGIN
 SELECT * INTO b FROM public.bookings WHERE id=target_booking FOR UPDATE;
 IF b.id IS NULL OR auth.uid() IS NULL OR NOT public.can_manage_property(b.property_id,ARRAY['owner','manager','staff']::public.admin_role[]) THEN RAISE EXCEPTION 'Payment access denied' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.booking_items WHERE booking_id=b.id AND rental_snapshot IS NOT NULL) OR b.booking_status IN ('held','cancelled') THEN RAISE EXCEPTION 'Only accepted rental bookings can receive payments here'; END IF;
 IF b.payment_status NOT IN ('pending','paid') THEN RAISE EXCEPTION 'Reconcile existing payment status before recording a rental receipt'; END IF;
 IF received_amount IS NULL OR received_amount<=0 OR received_amount<>round(received_amount,2) OR received_method NOT IN ('cash','pos','advance') OR nullif(trim(receipt_reference),'') IS NULL THEN RAISE EXCEPTION 'Enter actual amount received, method and unique receipt reference'; END IF;
 IF EXISTS(SELECT 1 FROM public.rental_payment_receipts WHERE booking_id=b.id AND reference=trim(receipt_reference)) THEN
   IF NOT EXISTS(SELECT 1 FROM public.rental_payment_receipts WHERE booking_id=b.id AND reference=trim(receipt_reference) AND amount=received_amount AND method=received_method) THEN RAISE EXCEPTION 'Receipt reference already records a different payment'; END IF;
   RETURN public.rental_payment_balance(b.id);
 END IF;
 SELECT COALESCE(sum(amount),0) INTO paid FROM public.rental_payment_receipts WHERE booking_id=b.id;
 IF b.payment_status='paid' OR paid+received_amount>b.total_amount THEN RAISE EXCEPTION 'Payment exceeds the recorded outstanding balance'; END IF;
 INSERT INTO public.rental_payment_receipts(booking_id,property_id,amount,currency,method,reference,recorded_by) VALUES(b.id,b.property_id,received_amount,b.currency,received_method,trim(receipt_reference),auth.uid());
 UPDATE public.bookings SET payment_status=CASE WHEN paid+received_amount=total_amount THEN 'paid' ELSE 'pending' END WHERE id=b.id;
 RETURN public.rental_payment_balance(b.id);
END $$;
REVOKE ALL ON FUNCTION public.rental_payment_balance(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.record_rental_payment(uuid,numeric,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rental_payment_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_rental_payment(uuid,numeric,text,text) TO authenticated;


-- Retain current confirmation payload; strip private allocation identifiers.
CREATE OR REPLACE FUNCTION public.get_booking_confirmation_package(target_token UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('reference',b.reference,'status',b.booking_status,'paymentStatus',b.payment_status,'paymentMethod',b.payment_method,'paidAmount',(SELECT COALESCE(sum(r.amount),0) FROM public.rental_payment_receipts r WHERE r.booking_id=b.id),'balanceDue',GREATEST(0,b.total_amount-(SELECT COALESCE(sum(r.amount),0) FROM public.rental_payment_receipts r WHERE r.booking_id=b.id)),'guestName',trim(g.first_name||' '||g.last_name),'checkIn',b.check_in,'checkOut',b.check_out,'adults',b.adults,'children',b.children,'infants',b.infants,'totalGuests',b.total_guests,'roomSubtotal',b.room_subtotal,'addonsSubtotal',b.addons_subtotal,'taxes',b.taxes_fees,'discount',b.discount_amount,'total',b.total_amount,'currency',b.currency,'items',COALESCE((SELECT jsonb_agg(jsonb_build_object('type',item.item_type,'title',item.title_snapshot,'quantity',item.quantity,'unitPrice',item.unit_price,'subtotal',item.total_price,'currency',COALESCE(item.currency,b.currency),'date',item.service_date,'time',item.service_time,'status',item.item_status,'metadata',item.metadata-'allocatedUnits'-'reservedFrom'-'reservedUntil') ORDER BY item.created_at,item.id) FROM public.booking_items item WHERE item.booking_id=b.id),'[]'::JSONB))
  FROM public.bookings b JOIN public.booking_guests g ON g.booking_id=b.id AND g.is_primary WHERE b.public_token=target_token AND b.booking_status<>'held' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_booking_confirmation_package(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_confirmation_package(UUID) TO anon,authenticated;

-- Trigger functions cannot be invoked as general RPCs.
REVOKE ALL ON FUNCTION public.guard_rental_configuration() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.guard_rental_item() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.allocate_rental_item() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_equipment_rental_times(selection jsonb,booking_context text DEFAULT 'standalone')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE h integer; q jsonb; results jsonb:='[]'; c jsonb;
BEGIN
 SELECT rental_config INTO c FROM public.experiences WHERE id=(selection->>'experienceId')::uuid;
 IF selection->>'mode'='daily' THEN
  BEGIN q:=public.rental_quote_internal(selection||jsonb_build_object('startTime',c->>'dailyStart'),booking_context); results:=jsonb_build_array(q-'unitKeys'-'begins'-'reservedUntil'); EXCEPTION WHEN SQLSTATE '22023' OR SQLSTATE '23P01' OR raise_exception THEN NULL; END;
 ELSE
  FOR h IN 0..23 LOOP
   BEGIN q:=public.rental_quote_internal(selection||jsonb_build_object('startTime',lpad(h::text,2,'0')||':00'),booking_context); results:=results||jsonb_build_array(q-'unitKeys'-'begins'-'reservedUntil'); EXCEPTION WHEN SQLSTATE '22023' OR SQLSTATE '23P01' OR raise_exception THEN NULL; END;
  END LOOP;
 END IF;
 RETURN results;
END $$;
REVOKE ALL ON FUNCTION public.get_equipment_rental_times(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_equipment_rental_times(jsonb,text) TO anon,authenticated;
-- Enrich the existing notification after its legacy experience formatter.
CREATE FUNCTION public.enrich_rental_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE lines jsonb; summary text; event_type text;
BEGIN
 IF NEW.booking_status='cancelled' AND OLD.booking_status IS DISTINCT FROM 'cancelled' THEN event_type:='booking_cancelled';
 ELSIF OLD.booking_status='held' AND NEW.booking_status IN ('pending','awaiting_payment','confirmed') THEN event_type:='booking_created';
 ELSE RETURN NEW; END IF;
 SELECT jsonb_agg(jsonb_build_object('title',i.title_snapshot,'date',i.service_date,'rental',i.rental_snapshot)),string_agg(concat(i.title_snapshot,' / ',i.service_date,' / ',i.rental_snapshot->>'mode',' / ',i.rental_snapshot->>'startTime','-',i.rental_snapshot->>'endTime',' / ',i.quantity,' equipment / ',i.rental_snapshot->>'adults',' adults, ',i.rental_snapshot->>'children',' children / ',i.total_price,' ',i.currency,' / ',i.rental_snapshot->'separatelyPayable'),'; ')
 INTO lines,summary FROM public.booking_items i WHERE i.booking_id=NEW.id AND i.rental_snapshot IS NOT NULL;
 IF lines IS NULL THEN RETURN NEW; END IF;
 UPDATE public.notifications SET message=concat(NEW.reference,' / ',summary,' / payment ',NEW.payment_status),metadata=COALESCE(metadata,'{}')||jsonb_build_object('rentals',lines,'paymentStatus',NEW.payment_status),updated_at=now() WHERE booking_id=NEW.id AND type=event_type;
 RETURN NEW;
END $$;
CREATE TRIGGER zzz_enrich_rental_notification AFTER UPDATE OF booking_status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enrich_rental_notification();
REVOKE ALL ON FUNCTION public.enrich_rental_notification() FROM PUBLIC,anon,authenticated;

-- Reconfirmations cannot revive equipment already released by expiry/cancel.
-- Wall-clock expiry is checked after the same property lock used by allocation.
CREATE FUNCTION public.guard_rental_booking_lifecycle() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.booking_items WHERE booking_id=NEW.id AND rental_snapshot IS NOT NULL) THEN RETURN NEW; END IF;
 IF NEW.booking_status IS NOT DISTINCT FROM OLD.booking_status AND NEW.hold_expires_at IS NOT DISTINCT FROM OLD.hold_expires_at THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));
 IF NEW.booking_status='held' AND (OLD.booking_status<>'held' OR NEW.hold_expires_at>OLD.hold_expires_at AND OLD.hold_expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'Released rentals must be booked again'; END IF;
 IF NEW.booking_status IN ('pending','awaiting_payment','confirmed','checked_in') THEN
  IF OLD.booking_status IN ('cancelled','completed') OR OLD.booking_status='held' AND (OLD.hold_expires_at IS NULL OR OLD.hold_expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'Released rentals must be booked again'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER a_guard_rental_booking_lifecycle BEFORE UPDATE OF booking_status,hold_expires_at ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guard_rental_booking_lifecycle();
REVOKE ALL ON FUNCTION public.guard_rental_booking_lifecycle() FROM PUBLIC,anon,authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
