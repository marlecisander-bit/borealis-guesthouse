BEGIN;

CREATE TABLE public.booking_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK(length(endpoint)<=2048),
  p256dh text NOT NULL CHECK(length(p256dh)=87),
  auth_key text NOT NULL CHECK(length(auth_key)=22),
  enabled boolean NOT NULL DEFAULT true,
  retired boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_push_enabled_devices_idx ON public.booking_push_devices(property_id) WHERE enabled;

CREATE TABLE public.booking_push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.booking_push_devices(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','expired','skipped','uncertain')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
  attempted_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  delivered_at timestamptz,
  result_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id,device_id)
);
CREATE INDEX booking_push_queue_idx ON public.booking_push_deliveries(next_attempt_at,created_at) WHERE status IN ('pending','sending');
CREATE INDEX booking_push_test_idx ON public.booking_push_deliveries(device_id,created_at DESC) WHERE notification_id IS NULL;
ALTER TABLE public.booking_push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_push_devices, public.booking_push_deliveries FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.booking_push_eligible(property uuid, actor uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_profiles p
    WHERE p.property_id=property AND p.user_id=actor AND p.is_active AND p.role IN ('owner','manager','staff'));
$$;

CREATE FUNCTION public.enqueue_booking_push() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.type IN ('booking_created','booking_modified','booking_cancelled') AND NEW.booking_id IS NOT NULL THEN
    INSERT INTO public.booking_push_deliveries(notification_id,device_id)
      SELECT NEW.id,d.id FROM public.booking_push_devices d
      WHERE d.property_id=NEW.property_id AND d.enabled AND public.booking_push_eligible(d.property_id,d.user_id)
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER enqueue_booking_push AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_booking_push();

-- Called by the application only after verifying the admin's signed-in session.
CREATE FUNCTION public.manage_booking_push_device(property uuid,actor uuid,action text,device_endpoint text,device_key text DEFAULT NULL,device_auth text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE device public.booking_push_devices%ROWTYPE; test_status text;
BEGIN
  IF NOT public.booking_push_eligible(property,actor) THEN RETURN NULL; END IF;
  IF action='enable' THEN
    INSERT INTO public.booking_push_devices(property_id,user_id,endpoint,p256dh,auth_key)
      VALUES(property,actor,device_endpoint,device_key,device_auth)
      ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth_key=excluded.auth_key,enabled=true,updated_at=now()
      WHERE booking_push_devices.property_id=property AND booking_push_devices.user_id=actor AND NOT booking_push_devices.retired
      RETURNING * INTO device;
    IF NOT FOUND THEN
      IF EXISTS(SELECT 1 FROM public.booking_push_devices d WHERE d.endpoint=device_endpoint AND d.property_id=property AND d.user_id=actor AND d.retired) THEN
        RETURN jsonb_build_object('enabled',false,'retired',true);
      END IF;
      RETURN jsonb_build_object('conflict',true);
    END IF;
  ELSE
    SELECT * INTO device FROM public.booking_push_devices d
      WHERE d.endpoint=device_endpoint AND d.property_id=property AND d.user_id=actor FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('enabled',false); END IF;
    IF action='disable' THEN
      UPDATE public.booking_push_devices SET enabled=false,updated_at=now() WHERE id=device.id;
      UPDATE public.booking_push_deliveries SET status='skipped',result_code='disabled',lease_token=NULL,lease_until=NULL
        WHERE device_id=device.id AND status IN ('pending','sending');
      RETURN jsonb_build_object('enabled',false);
    ELSIF action='test' AND device.enabled THEN
      IF NOT EXISTS(SELECT 1 FROM public.booking_push_deliveries d WHERE d.device_id=device.id AND d.notification_id IS NULL AND d.created_at>now()-interval '1 minute') THEN
        INSERT INTO public.booking_push_deliveries(device_id) VALUES(device.id);
      END IF;
    ELSIF action NOT IN ('status','test') THEN
      RETURN NULL;
    END IF;
  END IF;
  SELECT status INTO test_status FROM public.booking_push_deliveries d
    WHERE d.device_id=device.id AND d.notification_id IS NULL ORDER BY d.created_at DESC LIMIT 1;
  RETURN jsonb_build_object('enabled',device.enabled,'retired',device.retired,'testStatus',test_status);
END $$;

CREATE FUNCTION public.claim_booking_push(limit_count integer DEFAULT 8)
RETURNS TABLE(job_id uuid, lease uuid, attempt integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  -- A process outage can leave a lease behind. Retry within the same bounded
  -- attempt budget and keep the notification tag stable across retries.
  UPDATE public.booking_push_deliveries SET status='uncertain',result_code='lease_expired',lease_until=NULL,lease_token=NULL
    WHERE status='sending' AND lease_until<=now() AND attempts>=5;
  RETURN QUERY WITH candidates AS (
    SELECT d.id FROM public.booking_push_deliveries d
    WHERE d.attempts<5 AND ((d.status='pending' AND d.next_attempt_at<=now()) OR (d.status='sending' AND d.lease_until<=now()))
    ORDER BY d.next_attempt_at,d.created_at
    LIMIT greatest(0,least(8,limit_count)) FOR UPDATE SKIP LOCKED
  )
  UPDATE public.booking_push_deliveries d SET status='sending',attempts=d.attempts+1,attempted_at=now(),
    lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid()
    FROM candidates c WHERE d.id=c.id RETURNING d.id,d.lease_token,d.attempts;
END $$;

CREATE FUNCTION public.read_booking_push(job uuid, lease uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT jsonb_build_object('endpoint',d.endpoint,'p256dh',d.p256dh,'auth',d.auth_key,
    'type',coalesce(n.type,'test'),'bookingId',n.booking_id,'tag',coalesce(n.id,j.id))
  FROM public.booking_push_deliveries j JOIN public.booking_push_devices d ON d.id=j.device_id
  LEFT JOIN public.notifications n ON n.id=j.notification_id
  WHERE j.id=job AND j.lease_token=lease AND j.status='sending' AND j.lease_until>now()
    AND d.enabled AND public.booking_push_eligible(d.property_id,d.user_id)
    AND (j.notification_id IS NULL OR n.property_id=d.property_id);
$$;

CREATE FUNCTION public.finish_booking_push(job uuid, lease uuid, outcome text, code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE device uuid;
BEGIN
  IF outcome NOT IN ('sent','retry','failed','expired','skipped','uncertain') THEN RAISE EXCEPTION 'Invalid push outcome'; END IF;
  IF outcome='expired' THEN
    PERFORM 1 FROM public.booking_push_devices d JOIN public.booking_push_deliveries j ON j.device_id=d.id WHERE j.id=job FOR UPDATE OF d;
  END IF;
  UPDATE public.booking_push_deliveries j SET status=CASE WHEN outcome='retry' THEN
       CASE WHEN j.attempts<5 THEN 'pending' ELSE 'failed' END ELSE outcome END,
    result_code=code,delivered_at=CASE WHEN outcome='sent' THEN now() END,
    next_attempt_at=CASE WHEN outcome='retry' THEN now()+make_interval(secs=>60*(2^j.attempts)::integer) ELSE j.next_attempt_at END,
    lease_until=NULL,lease_token=NULL
    WHERE j.id=job AND j.lease_token=lease AND j.status='sending' RETURNING j.device_id INTO device;
  IF FOUND AND outcome='expired' THEN
    UPDATE public.booking_push_devices SET enabled=false,retired=true,updated_at=now() WHERE id=device;
    UPDATE public.booking_push_deliveries SET status='skipped',result_code='device_expired' WHERE device_id=device AND status='pending';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.booking_push_eligible(uuid,uuid),public.enqueue_booking_push(),
  public.manage_booking_push_device(uuid,uuid,text,text,text,text),public.claim_booking_push(integer),
  public.read_booking_push(uuid,uuid),public.finish_booking_push(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_booking_push_device(uuid,uuid,text,text,text,text),public.claim_booking_push(integer),
  public.read_booking_push(uuid,uuid),public.finish_booking_push(uuid,uuid,text,text) TO service_role;
CREATE FUNCTION public.booking_push_overview(property uuid, notifications uuid[])
RETURNS TABLE(notification_id uuid,pending bigint,sent bigint,issues bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT n.id,count(*) FILTER(WHERE d.status IN ('pending','sending')),count(*) FILTER(WHERE d.status='sent'),
      count(*) FILTER(WHERE d.status IN ('failed','expired','skipped','uncertain'))
  FROM public.notifications n JOIN public.booking_push_deliveries d ON d.notification_id=n.id
  WHERE n.property_id=property AND n.id=ANY(notifications) AND cardinality(notifications)<=50
    AND public.booking_push_eligible(property,auth.uid())
  GROUP BY n.id;
$$;
REVOKE ALL ON FUNCTION public.booking_push_overview(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_push_overview(uuid,uuid[]) TO authenticated;

COMMIT;
