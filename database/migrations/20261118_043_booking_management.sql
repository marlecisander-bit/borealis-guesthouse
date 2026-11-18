BEGIN;

CREATE TABLE public.booking_management_operations (
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  operation text NOT NULL CHECK(operation IN ('modify','cancel','request_change','request_cancel')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  input jsonb NOT NULL,
  outcome jsonb NOT NULL,
  review_status text CHECK(review_status IN ('pending','reviewed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(booking_id,operation_id)
);
CREATE INDEX booking_management_pending_requests_idx ON public.booking_management_operations(created_at) WHERE review_status='pending';
ALTER TABLE public.booking_management_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_management_operations FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.manage_booking(
  target_token uuid, target_booking uuid, action text,
  operation_id uuid DEFAULT NULL, payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  b public.bookings%ROWTYPE; item public.booking_items%ROWTYPE;
  reservation public.room_reservations%ROWTYPE; rt public.room_types%ROWTYPE;
  previous public.booking_management_operations%ROWTYPE;
  property uuid; staff boolean:=target_token IS NULL;
  policy text; change_hours integer; cancel_hours integer; notice integer; horizon integer;
  simple boolean; change_allowed boolean; cancel_allowed boolean;
  stay_start date; stay_end date; a integer; c integer; i integer;
  price jsonb; total numeric; version text; result jsonb;
  request_status text; history_rows jsonb;
BEGIN
  IF (target_token IS NULL)=(target_booking IS NULL) THEN RETURN NULL; END IF;
  SELECT property_id INTO property FROM public.bookings
    WHERE (staff AND id=target_booking) OR (NOT staff AND public_token=target_token AND booking_status<>'held');
  IF property IS NULL OR (staff AND NOT public.can_manage_property(property,ARRAY['owner','manager','staff']::public.admin_role[])) THEN RETURN NULL; END IF;

  IF action IN ('modify','cancel','request_change','request_cancel','review') THEN
    IF action='modify' THEN PERFORM public.expire_booking_holds(property); END IF;
    PERFORM pg_advisory_xact_lock(hashtext(property::text));
  END IF;
  SELECT * INTO b FROM public.bookings
    WHERE property_id=property AND ((staff AND id=target_booking) OR (NOT staff AND public_token=target_token AND booking_status<>'held'))
    FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF action IN ('request_change','request_cancel') THEN
    payload:=jsonb_build_object('message',trim(coalesce(payload->>'message','')));
  ELSIF action='cancel' THEN
    payload:=jsonb_build_object('confirmed',payload->>'confirmed');
  ELSIF action IN ('quote','modify') THEN
    payload:=jsonb_build_object('checkIn',payload->>'checkIn','checkOut',payload->>'checkOut',
      'adults',payload->>'adults','children',payload->>'children','infants',payload->>'infants','version',payload->>'version');
  END IF;
  IF action IN ('modify','cancel','request_change','request_cancel') THEN
    IF operation_id IS NULL THEN RAISE EXCEPTION 'Missing operation identifier' USING ERRCODE='22023'; END IF;
    SELECT * INTO previous FROM public.booking_management_operations o WHERE o.booking_id=b.id AND o.operation_id=manage_booking.operation_id;
    IF FOUND THEN
      IF previous.operation<>action OR previous.input IS DISTINCT FROM payload OR previous.actor_id IS DISTINCT FROM (CASE WHEN staff THEN auth.uid() ELSE NULL END) THEN
        RAISE EXCEPTION 'Operation already used' USING ERRCODE='22023';
      END IF;
      RETURN previous.outcome;
    END IF;
  END IF;

  SELECT max(value_text) FILTER(WHERE setting_key='cancellation_policy_reference'),
         max(value_number) FILTER(WHERE setting_key='guest_change_cutoff_hours' AND value_number BETWEEN 0 AND 8760),
         max(value_number) FILTER(WHERE setting_key='guest_cancel_cutoff_hours' AND value_number BETWEEN 0 AND 8760),
         coalesce(max(value_number) FILTER(WHERE setting_key='minimum_advance_hours'),0),
         coalesce(max(value_number) FILTER(WHERE setting_key='maximum_booking_horizon_days'),730)
  INTO policy,change_hours,cancel_hours,notice,horizon
  FROM public.site_settings WHERE property_id=property AND status='published';

  SELECT * INTO item FROM public.booking_items WHERE booking_id=b.id AND item_type='room' LIMIT 1;
  SELECT * INTO reservation FROM public.room_reservations WHERE booking_id=b.id AND room_id=item.room_id;
  simple:=coalesce(b.source IN ('direct','admin') AND b.payment_status='pending'
    AND b.payment_method='pay_at_property' AND b.booking_status='confirmed'
    AND b.check_in>(now() AT TIME ZONE 'Europe/Tirane')::date
    AND item.id IS NOT NULL AND item.room_type_id IS NOT NULL AND reservation.id IS NOT NULL
    AND (reservation.check_in,reservation.check_out,reservation.booking_status)=(b.check_in,b.check_out,b.booking_status)
    AND coalesce(b.addons_subtotal,0)=0 AND coalesce(b.taxes_fees,0)=0
    AND (SELECT count(*) FROM public.booking_items WHERE booking_id=b.id)=1
    AND (SELECT count(*) FROM public.room_reservations WHERE booking_id=b.id)=1
    AND NOT EXISTS(SELECT 1 FROM public.payments WHERE booking_id=b.id),false);
  change_allowed:=simple AND (staff OR (change_hours IS NOT NULL AND
    (b.check_in::timestamp AT TIME ZONE 'Europe/Tirane')>=now()+make_interval(hours=>change_hours)));
  cancel_allowed:=simple AND (staff OR (nullif(trim(policy),'') IS NOT NULL AND cancel_hours IS NOT NULL AND
    (b.check_in::timestamp AT TIME ZONE 'Europe/Tirane')>=now()+make_interval(hours=>cancel_hours)));

  IF action='read' THEN
    SELECT jsonb_agg(jsonb_build_object('id',o.operation_id,'operation',o.operation,'input',o.input,'outcome',o.outcome,
      'status',o.review_status,'createdAt',o.created_at,'actorId',o.actor_id,'reviewedBy',o.reviewed_by,'reviewedAt',o.reviewed_at) ORDER BY o.created_at DESC)
    INTO history_rows FROM public.booking_management_operations o WHERE o.booking_id=b.id AND staff;
    SELECT o.review_status INTO request_status FROM public.booking_management_operations o
      WHERE o.booking_id=b.id AND o.review_status IS NOT NULL ORDER BY (o.review_status='pending') DESC,o.created_at DESC LIMIT 1;
    RETURN jsonb_build_object('status',b.booking_status,'policy',policy,'canChange',change_allowed,'canCancel',cancel_allowed,
      'changeHours',change_hours,'cancelHours',cancel_hours,'canRequest',b.booking_status IN ('pending','awaiting_payment','confirmed','checked_in'),
      'requestStatus',request_status,'history',coalesce(history_rows,'[]'::jsonb),'checkIn',b.check_in,'checkOut',b.check_out,
      'adults',b.adults,'children',b.children,'infants',coalesce(b.infants,0),'total',b.total_amount,'currency',b.currency);
  ELSIF action='review' AND staff THEN
    UPDATE public.booking_management_operations o SET review_status='reviewed',reviewed_by=auth.uid(),reviewed_at=now()
      WHERE o.booking_id=b.id AND o.operation_id=manage_booking.operation_id AND o.review_status='pending';
    RETURN jsonb_build_object('result','reviewed');
  ELSIF action IN ('request_change','request_cancel') AND NOT staff THEN
    IF b.booking_status NOT IN ('pending','awaiting_payment','confirmed','checked_in') THEN RETURN jsonb_build_object('result','unavailable'); END IF;
    IF length(trim(coalesce(payload->>'message',''))) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Add request details' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM public.booking_management_operations o WHERE o.booking_id=b.id AND o.review_status='pending') THEN
      RETURN jsonb_build_object('result','already_requested');
    END IF;
    result:=jsonb_build_object('result','requested');
    INSERT INTO public.booking_management_operations(booking_id,operation_id,operation,input,outcome,review_status)
      VALUES(b.id,manage_booking.operation_id,action,payload,result,'pending');
    RETURN result;
  ELSIF action='cancel' THEN
    IF b.booking_status='cancelled' THEN RETURN jsonb_build_object('result','cancelled'); END IF;
    IF NOT cancel_allowed THEN RETURN jsonb_build_object('result','review_required'); END IF;
    IF payload->>'confirmed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Confirm cancellation' USING ERRCODE='22023'; END IF;
    UPDATE public.bookings SET status='cancelled',booking_status='cancelled',hold_expires_at=NULL,
      updated_by=CASE WHEN staff THEN auth.uid() ELSE NULL END,updated_at=now() WHERE id=b.id;
    result:=jsonb_build_object('result','cancelled','bookingId',b.id);
  ELSIF action IN ('quote','modify') THEN
    IF NOT change_allowed THEN RETURN jsonb_build_object('result','review_required'); END IF;
    stay_start:=(payload->>'checkIn')::date; stay_end:=(payload->>'checkOut')::date;
    a:=(payload->>'adults')::int; c:=(payload->>'children')::int; i:=(payload->>'infants')::int;
    IF stay_start IS NULL OR stay_end IS NULL OR stay_end<=stay_start OR stay_end-stay_start>365 OR
       (stay_start::timestamp AT TIME ZONE 'Europe/Tirane')<now()+make_interval(hours=>greatest(notice,CASE WHEN staff THEN 0 ELSE change_hours END)) OR
       stay_start>(now() AT TIME ZONE 'Europe/Tirane')::date+horizon OR a IS NULL OR c IS NULL OR i IS NULL OR a NOT BETWEEN 1 AND 30 OR c NOT BETWEEN 0 AND 30 OR i NOT BETWEEN 0 AND 30 THEN
      RETURN jsonb_build_object('result','invalid');
    END IF;
    IF (stay_start,stay_end,a,c,i)=(b.check_in,b.check_out,b.adults,b.children,coalesce(b.infants,0)) THEN
      RETURN jsonb_build_object('result','unchanged');
    END IF;
    SELECT * INTO rt FROM public.room_types WHERE id=item.room_type_id AND property_id=property FOR SHARE;
    PERFORM public.validate_room_occupancy(rt.id,a,c,i);
    PERFORM 1 FROM public.rooms WHERE id=item.room_id AND property_id=property AND room_type_id=rt.id AND active AND status='published' AND availability_status='available' FOR SHARE;
    IF NOT FOUND OR EXISTS(SELECT 1 FROM public.availability_blocks ab WHERE ab.property_id=property AND ab.status='published'
        AND (ab.room_id=item.room_id OR ab.room_type_id=rt.id) AND daterange(ab.start_date,ab.end_date,'[]')&&daterange(stay_start,stay_end,'[)'))
      OR EXISTS(SELECT 1 FROM public.room_reservations rr WHERE rr.room_id=item.room_id AND rr.booking_id<>b.id
        AND rr.booking_status IN ('held','pending','awaiting_payment','confirmed','checked_in')
        AND (rr.booking_status<>'held' OR rr.hold_expires_at>now()) AND daterange(rr.check_in,rr.check_out,'[)')&&daterange(stay_start,stay_end,'[)')) THEN
      RETURN jsonb_build_object('result','conflict');
    END IF;
    price:=public.calculate_room_stay_price(property,rt.id,stay_start,stay_end,a+c+CASE WHEN coalesce(rt.infants_count_toward_capacity,true) THEN i ELSE 0 END);
    IF price->>'currency' IS DISTINCT FROM b.currency::text THEN RETURN jsonb_build_object('result','review_required'); END IF;
    total:=(price->>'roomSubtotal')::numeric;
    version:=md5(jsonb_build_array(b.id,b.updated_at,b.check_in,b.check_out,b.total_amount,b.adults,b.children,b.infants,stay_start,stay_end,a,c,i,price)::text);
    IF action='quote' THEN RETURN jsonb_build_object('result','quoted','total',total,'currency',b.currency,'version',version); END IF;
    IF payload->>'version' IS DISTINCT FROM version THEN RETURN jsonb_build_object('result','requote'); END IF;
    UPDATE public.room_reservations SET check_in=stay_start,check_out=stay_end WHERE id=reservation.id;
    UPDATE public.booking_items SET quantity=1,unit_price=total,total_price=total,
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('requestedQuantity',1,'guestCount',a+c+i,'occupancy',jsonb_build_object('adults',a,'children',c,'infants',i),
      'night_count',stay_end-stay_start,'nightly_rates',price->'nightlyRates','discount',price->'discount'),updated_at=now() WHERE id=item.id;
    UPDATE public.bookings SET check_in=stay_start,check_out=stay_end,adults=a,children=c,infants=i,total_guests=a+c+i,
      room_subtotal=total,subtotal=total,total_amount=total,discount_amount=(price->>'discount')::numeric,
      updated_by=CASE WHEN staff THEN auth.uid() ELSE NULL END,updated_at=now() WHERE id=b.id;
    result:=jsonb_build_object('result','modified','bookingId',b.id,'total',total,'currency',b.currency,'previous',jsonb_build_object(
      'checkIn',b.check_in,'checkOut',b.check_out,'adults',b.adults,'children',b.children,'infants',b.infants,'total',b.total_amount));
  ELSE
    RAISE EXCEPTION 'Invalid booking operation' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.booking_management_operations(booking_id,operation_id,operation,actor_id,input,outcome)
    VALUES(b.id,manage_booking.operation_id,action,CASE WHEN staff THEN auth.uid() ELSE NULL END,payload,result);
  RETURN result;
EXCEPTION WHEN exclusion_violation THEN
  RETURN jsonb_build_object('result','conflict');
END $$;

REVOKE ALL ON FUNCTION public.manage_booking(uuid,uuid,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_booking(uuid,uuid,text,uuid,jsonb) TO anon,authenticated;
CREATE FUNCTION public.booking_review_queue(target_property uuid)
RETURNS TABLE(booking_id uuid, reference text, operation text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT o.booking_id,b.reference,o.operation,o.created_at
  FROM public.booking_management_operations o JOIN public.bookings b ON b.id=o.booking_id
  WHERE b.property_id=target_property AND o.review_status='pending'
    AND public.can_manage_property(target_property,ARRAY['owner','manager','staff']::public.admin_role[])
  ORDER BY o.created_at;
$$;
REVOKE ALL ON FUNCTION public.booking_review_queue(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_review_queue(uuid) TO authenticated;
-- A modification is keyed by the committed change; other events retain their
-- original uniqueness. Held bookings never emit a completed cancellation.
ALTER TABLE public.notifications DROP CONSTRAINT notifications_property_id_type_entity_type_entity_id_key;
CREATE UNIQUE INDEX notifications_non_modification_uidx
  ON public.notifications(property_id,type,entity_type,entity_id) WHERE type<>'booking_modified';

CREATE OR REPLACE FUNCTION public.enqueue_booking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  event_type TEXT;
  event_title TEXT;
  event_message TEXT;
  queued_notification_id UUID;
  notification_enabled BOOLEAN:=TRUE;
  email_enabled BOOLEAN:=TRUE;
  primary_email TEXT;
  additional_emails TEXT;
  guest_name TEXT;
  room_name TEXT;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.booking_status IN ('pending','awaiting_payment','confirmed','checked_in') THEN
      event_type:='booking_created';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF NEW.booking_status='cancelled' AND OLD.booking_status IN ('pending','awaiting_payment','confirmed','checked_in') THEN
    event_type:='booking_cancelled';
  ELSIF OLD.booking_status='held' AND NEW.booking_status IN ('pending','awaiting_payment','confirmed') THEN
    event_type:='booking_created';
  ELSIF NEW.booking_status IN ('pending','awaiting_payment','confirmed','checked_in')
    AND (OLD.check_in,OLD.check_out,OLD.adults,OLD.children,OLD.infants,OLD.total_amount)
      IS DISTINCT FROM (NEW.check_in,NEW.check_out,NEW.adults,NEW.children,NEW.infants,NEW.total_amount) THEN
    event_type:='booking_modified';
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(s.value_boolean,TRUE) INTO notification_enabled
  FROM public.site_settings s
  WHERE s.property_id=NEW.property_id AND s.setting_key='notify_'||event_type;
  IF NOT COALESCE(notification_enabled,TRUE) THEN RETURN NEW; END IF;

  SELECT trim(concat_ws(' ',g.first_name,g.last_name)) INTO guest_name
  FROM public.booking_guests g WHERE g.booking_id=NEW.id
  ORDER BY g.is_primary DESC,g.created_at LIMIT 1;
  SELECT COALESCE(i.title_snapshot,rt.name,r.title) INTO room_name
  FROM public.booking_items i
  LEFT JOIN public.room_types rt ON rt.id=i.room_type_id
  LEFT JOIN public.rooms r ON r.id=i.room_id
  WHERE i.booking_id=NEW.id AND i.item_type='room' LIMIT 1;

  event_title:=CASE event_type
    WHEN 'booking_cancelled' THEN 'Booking cancelled'
    WHEN 'booking_modified' THEN 'Booking modified'
    ELSE 'New booking'
  END;
  event_message:=concat(
    COALESCE(NULLIF(NEW.reference,''),'Booking'),
    CASE WHEN guest_name IS NOT NULL AND guest_name<>'' THEN ' · '||guest_name ELSE '' END,
    CASE WHEN room_name IS NOT NULL AND room_name<>'' THEN ' · '||room_name ELSE '' END,
    CASE WHEN NEW.check_in IS NOT NULL THEN ' · '||to_char(NEW.check_in,'DD Mon YYYY') ELSE '' END
  );

  INSERT INTO public.notifications(
    property_id,type,title,message,entity_type,entity_id,booking_id,metadata
  ) VALUES(
    NEW.property_id,event_type,event_title,event_message,'booking',NEW.id,NEW.id,
    jsonb_build_object('reference',COALESCE(NEW.reference,''),'source',COALESCE(NEW.source,'direct'))
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO queued_notification_id;

  IF queued_notification_id IS NULL THEN RETURN NEW; END IF;

  -- Delivery preparation is deliberately isolated. A malformed address or
  -- future provider-related schema problem must not roll back the durable
  -- in-app notification created above.
  BEGIN
    SELECT COALESCE(bool_or(s.value_boolean),TRUE) INTO email_enabled
    FROM public.site_settings s
    WHERE s.property_id=NEW.property_id AND s.setting_key='owner_notification_enabled';
    IF COALESCE(email_enabled,TRUE) THEN
      SELECT max(s.value_text) FILTER(WHERE s.setting_key='booking_notification_email'),
             max(s.value_text) FILTER(WHERE s.setting_key='owner_notification_additional_emails')
        INTO primary_email,additional_emails
      FROM public.site_settings s
      WHERE s.property_id=NEW.property_id
        AND s.setting_key IN ('booking_notification_email','owner_notification_additional_emails');
      IF NULLIF(trim(primary_email),'') IS NULL THEN
        SELECT p.email INTO primary_email FROM public.properties p WHERE p.id=NEW.property_id;
      END IF;

      INSERT INTO public.notification_deliveries(
        notification_id,property_id,channel,recipient
      )
      SELECT
        queued_notification_id,NEW.property_id,'email',lower(btrim(address_row.email))
      FROM string_to_table(
        replace(
          replace(concat_ws(',',primary_email,additional_emails),E'\n',','),
          ';',','
        ),
        ','
      ) AS address_row(email)
      WHERE btrim(address_row.email)<>''
        AND position('@' IN address_row.email)>1
        AND position('.' IN split_part(address_row.email,'@',2))>0
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.notifications
    SET metadata=metadata||jsonb_build_object('emailQueueError',left(SQLERRM,300)),updated_at=NOW()
    WHERE id=queued_notification_id;
    RAISE WARNING 'Notification % was saved but email delivery could not be queued: %',queued_notification_id,SQLERRM;
  END;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification defect must never make a valid booking transaction fail.
  RAISE WARNING 'Could not enqueue booking notification for %: %',NEW.id,SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enqueue_booking_notification ON public.bookings;
CREATE TRIGGER enqueue_booking_notification
AFTER INSERT OR UPDATE OF booking_status,check_in,check_out,adults,children,infants,total_amount
ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enqueue_booking_notification();

COMMIT;
