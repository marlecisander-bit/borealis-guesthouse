BEGIN;

ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS team_permissions text[];
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS team_preset text;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS team_email text;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  email text NOT NULL,
  display_name text NOT NULL,
  preset text NOT NULL,
  permissions text[] NOT NULL,
  state text NOT NULL DEFAULT 'invited' CHECK (state IN ('invited','accepted','cancelled')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id,email)
);

CREATE TABLE IF NOT EXISTS public.team_access_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  actor uuid NOT NULL,
  target uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_owner_locks (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id),
  version bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_owner_locks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_invitations,public.team_access_audit,public.team_owner_locks FROM PUBLIC,anon,authenticated;

-- An existing owner keeps the same Auth identity. All other existing
-- memberships retain their legacy grants until explicitly converted.
CREATE OR REPLACE FUNCTION public.can_manage_property(
  target_property uuid,
  allowed_roles public.admin_role[] DEFAULT ARRAY['owner','manager','editor','staff']::public.admin_role[]
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles p WHERE p.user_id=auth.uid()
      AND p.property_id=target_property AND p.is_active AND p.role=ANY(allowed_roles)
      AND p.team_permissions IS NULL
  )
$$;
REVOKE ALL ON FUNCTION public.can_manage_property(uuid,public.admin_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_property(uuid,public.admin_role[]) TO authenticated;

-- Older policies called these helpers instead of can_manage_property.
DO $$
DECLARE spec record;
BEGIN
  FOR spec IN SELECT * FROM (VALUES
    ('can_manage_amenities','owner,manager,editor'),
    ('can_manage_rates','owner,manager'),
    ('can_manage_availability','owner,manager,staff'),
    ('can_manage_site_content','owner,manager,editor'),
    ('can_manage_homepage','owner,manager,editor'),
    ('can_manage_experiences','owner,manager,editor')
  ) AS v(helper,roles) LOOP
    EXECUTE format('CREATE OR REPLACE FUNCTION public.%I(target_property uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = %L AS %L',
      spec.helper,'',format('SELECT public.can_manage_property(target_property,%L::public.admin_role[])','{'||spec.roles||'}'));
  END LOOP;
END $$;

-- Some older installations still have the helper defined in cms-foundation.sql.
DO $$
BEGIN
  IF to_regprocedure('public.is_property_admin(uuid,text[])') IS NOT NULL THEN
    EXECUTE $legacy$
      CREATE OR REPLACE FUNCTION public.is_property_admin(target_property uuid, allowed_roles text[] DEFAULT ARRAY['owner','manager','editor','staff'])
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS
      'SELECT public.can_manage_property(target_property,ARRAY(SELECT unnest(allowed_roles)::public.admin_role))'
    $legacy$;
  END IF;
END $$;

DROP POLICY IF EXISTS admin_profiles_owner_manage ON public.admin_profiles;
REVOKE INSERT, UPDATE, DELETE ON public.admin_profiles FROM anon,authenticated;

-- Preserve the public published projection even on databases where the
-- previous draft-column restriction has not been installed.
REVOKE SELECT ON public.cms_documents FROM PUBLIC,anon,authenticated;
REVOKE SELECT(draft_data) ON public.cms_documents FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,property_id,document_key,data,status) ON public.cms_documents TO anon,authenticated;

-- Replace the legacy email-based policies present on the hosted property.
DROP POLICY IF EXISTS "Admins can upload public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete public media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert media" ON public.media_assets;
DROP POLICY IF EXISTS "Admins can update media" ON public.media_assets;
DROP POLICY IF EXISTS "Admins can delete media" ON public.media_assets;
CREATE POLICY "Admins can insert media" ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));
CREATE POLICY "Admins can update media" ON public.media_assets FOR UPDATE TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));
CREATE POLICY "Admins can delete media" ON public.media_assets FOR DELETE TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','editor']::public.admin_role[]));

DROP POLICY IF EXISTS "Admins can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property media" ON storage.objects;
CREATE OR REPLACE FUNCTION public.team_legacy_media_path(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles p WHERE p.user_id=auth.uid() AND p.is_active
    AND p.team_permissions IS NULL
    AND p.property_id::text=(storage.foldername(object_name))[1]
  )
$$;
REVOKE ALL ON FUNCTION public.team_legacy_media_path(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_legacy_media_path(text) TO authenticated;
CREATE POLICY "Admins can upload property media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK(bucket_id='public-media' AND public.team_legacy_media_path(name));
CREATE POLICY "Admins can update property media" ON storage.objects FOR UPDATE TO authenticated
  USING(bucket_id='public-media' AND public.team_legacy_media_path(name))
  WITH CHECK(bucket_id='public-media' AND public.team_legacy_media_path(name));
CREATE POLICY "Admins can delete property media" ON storage.objects FOR DELETE TO authenticated
  USING(bucket_id='public-media' AND public.team_legacy_media_path(name));

CREATE OR REPLACE FUNCTION public.booking_push_eligible(property uuid, actor uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_profiles p
    WHERE p.property_id=property AND p.user_id=actor AND p.is_active
    AND p.team_permissions IS NULL AND p.role IN ('owner','manager','staff'))
$$;

-- Owner-email settings may still contain addresses of team members. The
-- dispatcher checks the current membership immediately before claiming mail.
CREATE OR REPLACE FUNCTION public.team_email_recipient_allowed(target_property uuid, recipient_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT NOT EXISTS(
    SELECT 1 FROM public.admin_profiles p JOIN auth.users u ON u.id=p.user_id
    WHERE p.property_id=target_property AND lower(trim(recipient_email))=lower(u.email)
      AND (NOT p.is_active OR p.team_permissions IS NOT NULL)
  )
$$;
REVOKE ALL ON FUNCTION public.team_email_recipient_allowed(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.team_email_recipient_allowed(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.team_protect_last_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF TG_OP='UPDATE' AND (OLD.property_id<>NEW.property_id OR OLD.user_id<>NEW.user_id) THEN
    RAISE EXCEPTION 'Membership identity cannot be changed' USING ERRCODE='42501';
  END IF;
  IF OLD.role='owner' AND OLD.is_active AND OLD.team_permissions IS NULL THEN
    IF TG_OP='DELETE' OR NEW.role<>'owner' OR NOT NEW.is_active OR NEW.team_permissions IS NOT NULL THEN
      INSERT INTO public.team_owner_locks(property_id) VALUES(OLD.property_id)
        ON CONFLICT(property_id) DO UPDATE SET version=public.team_owner_locks.version+1;
      IF NOT EXISTS(SELECT 1 FROM public.admin_profiles p WHERE p.property_id=OLD.property_id
        AND p.id<>OLD.id AND p.role='owner' AND p.is_active AND p.team_permissions IS NULL) THEN
        RAISE EXCEPTION 'Last active Super Admin must remain' USING ERRCODE='23514';
      END IF;
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS team_last_owner ON public.admin_profiles;
CREATE TRIGGER team_last_owner BEFORE UPDATE OR DELETE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.team_protect_last_owner();

CREATE OR REPLACE FUNCTION public.team_permissions_normalized(input text[])
RETURNS text[] LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE result text[];
BEGIN
  IF input IS NULL OR array_position(input,NULL) IS NOT NULL OR NOT input <@ ARRAY[
    'bookings.view','bookings.contacts','bookings.manage','bookings.export','availability.manage','rooms.content','rooms.capacity',
    'rates.manage','offers.manage','website.draft','website.publish'
  ]::text[] THEN RAISE EXCEPTION 'Unknown permission' USING ERRCODE='22023'; END IF;
  IF input && ARRAY['bookings.contacts','bookings.manage','bookings.export'] THEN input:=input||'bookings.view'::text; END IF;
  IF 'website.publish'=ANY(input) THEN input:=input||'website.draft'::text; END IF;
  SELECT ARRAY(SELECT DISTINCT unnest(input) ORDER BY 1) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.team_has_permission(property uuid, permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_profiles p WHERE p.property_id=property AND p.user_id=auth.uid()
    AND p.is_active AND permission=ANY(p.team_permissions))
$$;
REVOKE ALL ON FUNCTION public.team_has_permission(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_has_permission(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.team_directory(target_property uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT public.can_manage_property(target_property,ARRAY['owner']::public.admin_role[]) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.status,t.email) FROM (
    SELECT p.id,p.display_name AS name,u.email,CASE WHEN p.role='owner' THEN 'Super Admin' ELSE coalesce(p.team_preset,'Legacy '||p.role::text) END AS preset,
      p.team_permissions AS permissions,CASE WHEN p.is_active THEN 'Active' ELSE 'Suspended' END AS status
    FROM public.admin_profiles p JOIN auth.users u ON u.id=p.user_id WHERE p.property_id=target_property
    UNION ALL
    SELECT i.id,i.display_name,i.email,i.preset,i.permissions,'Invited' FROM public.team_invitations i WHERE i.property_id=target_property AND i.state='invited'
  ) t),'[]'::jsonb);
END $$;

CREATE TABLE IF NOT EXISTS public.team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  name text NOT NULL,
  permissions text[] NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS team_roles_property_name ON public.team_roles(property_id, lower(name));
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_roles FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.team_role_list(target_property uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT public.can_manage_property(target_property,ARRAY['owner']::public.admin_role[]) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'permissions',r.permissions) ORDER BY lower(r.name))
    FROM public.team_roles r WHERE r.property_id=target_property),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.team_role_list(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.team_role_list(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.team_manage(target_property uuid, operation text, target uuid, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE invite public.team_invitations%ROWTYPE; member public.admin_profiles%ROWTYPE;
  email_value text:=lower(trim(payload->>'email')); preset_value text:=payload->>'preset'; grants text[]; previous jsonb:='{}';
BEGIN
  IF NOT public.can_manage_property(target_property,ARRAY['owner']::public.admin_role[]) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
  INSERT INTO public.team_owner_locks(property_id) VALUES(target_property)
    ON CONFLICT(property_id) DO UPDATE SET version=public.team_owner_locks.version+1;
  IF NOT public.can_manage_property(target_property,ARRAY['owner']::public.admin_role[]) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
  IF operation='create_role' THEN
    preset_value:=trim(payload->>'name');
    IF coalesce(length(preset_value),0) NOT BETWEEN 1 AND 60
      OR lower(preset_value) IN ('owner','super admin','property manager','rooms editor','availability operator','bookings viewer','website editor')
      OR lower(preset_value) LIKE 'legacy %' THEN
      RAISE EXCEPTION 'Choose a distinct role name' USING ERRCODE='22023';
    END IF;
    grants:=public.team_permissions_normalized(ARRAY(SELECT jsonb_array_elements_text(payload->'permissions')));
    INSERT INTO public.team_roles(property_id,name,permissions) VALUES(target_property,preset_value,grants) RETURNING id INTO target;
    INSERT INTO public.team_access_audit(property_id,actor,target,action,details)
      VALUES(target_property,auth.uid(),target,operation,jsonb_build_object('name',preset_value,'permissions',grants));
    RETURN jsonb_build_object('id',target);
  END IF;
  IF operation IN ('invite','permissions') AND coalesce(payload->>'roleId','')<>'' THEN
    SELECT r.name,r.permissions INTO preset_value,grants FROM public.team_roles r
      WHERE r.property_id=target_property AND r.id=(payload->>'roleId')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Role unavailable' USING ERRCODE='22023'; END IF;
  ELSIF operation IN ('invite','permissions') THEN
    IF preset_value IS NULL OR preset_value NOT IN ('Property Manager','Rooms Editor','Availability Operator','Bookings Viewer','Website Editor') THEN
      RAISE EXCEPTION 'Choose a preset' USING ERRCODE='22023';
    END IF;
    grants:=public.team_permissions_normalized(ARRAY(SELECT jsonb_array_elements_text(payload->'permissions')));
  END IF;
  IF operation='invite' THEN
    IF email_value IS NULL OR length(email_value)>254 OR email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      OR coalesce(length(trim(payload->>'name')),0) NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'Enter a name and email' USING ERRCODE='22023';
    END IF;
    IF EXISTS(SELECT 1 FROM public.admin_profiles p JOIN auth.users u ON u.id=p.user_id WHERE p.property_id=target_property AND lower(u.email)=email_value) THEN
      RAISE EXCEPTION 'This email already has a membership' USING ERRCODE='23505';
    END IF;
    INSERT INTO public.team_invitations(property_id,email,display_name,preset,permissions,expires_at)
      VALUES(target_property,email_value,trim(payload->>'name'),preset_value,grants,now()+interval '24 hours')
      ON CONFLICT(property_id,email) DO UPDATE SET id=gen_random_uuid(),display_name=excluded.display_name,preset=excluded.preset,permissions=excluded.permissions,
      expires_at=excluded.expires_at,state='invited' WHERE public.team_invitations.state='cancelled' RETURNING * INTO invite;
    IF invite.id IS NULL THEN RAISE EXCEPTION 'Invitation already exists. Use resend.' USING ERRCODE='23505'; END IF;
  ELSIF operation IN ('resend','cancel') THEN
    UPDATE public.team_invitations SET state=CASE WHEN operation='cancel' THEN 'cancelled' ELSE 'invited' END,
      expires_at=CASE WHEN operation='resend' THEN now()+interval '24 hours' ELSE expires_at END
      WHERE property_id=target_property AND id=target AND state='invited' RETURNING * INTO invite;
    IF invite.id IS NULL THEN RAISE EXCEPTION 'Invitation is no longer pending' USING ERRCODE='22023'; END IF;
  ELSIF operation IN ('permissions','suspend','restore') THEN
    SELECT * INTO member FROM public.admin_profiles WHERE id=target AND property_id=target_property FOR UPDATE;
    IF member.id IS NULL OR member.role='owner' THEN RAISE EXCEPTION 'Protected or unavailable membership' USING ERRCODE='42501'; END IF;
    previous:=jsonb_build_object('previousPermissions',member.team_permissions,'previousPreset',member.team_preset,'previousActive',member.is_active);
    UPDATE public.admin_profiles SET
      team_permissions=CASE WHEN operation='permissions' THEN grants ELSE team_permissions END,
      team_preset=CASE WHEN operation='permissions' THEN preset_value ELSE team_preset END,
      is_active=CASE WHEN operation='suspend' THEN false WHEN operation='restore' THEN true ELSE is_active END,
      updated_by=auth.uid() WHERE id=member.id;
  ELSE RAISE EXCEPTION 'Unsupported team operation' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.team_access_audit(property_id,actor,target,action,details) VALUES(
    target_property,auth.uid(),coalesce(invite.id,member.user_id),operation,previous||jsonb_strip_nulls(jsonb_build_object(
      'preset',preset_value,'permissions',grants,'email',invite.email)));
  RETURN jsonb_build_object('id',coalesce(invite.id,member.id),'email',invite.email);
END $$;

CREATE OR REPLACE FUNCTION public.team_accept(invitation uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE invite public.team_invitations%ROWTYPE; identity_email text;
BEGIN
  SELECT lower(u.email) INTO identity_email FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
  SELECT * INTO invite FROM public.team_invitations i WHERE i.id=invitation FOR UPDATE;
  IF identity_email IS NULL OR invite.id IS NULL OR invite.state<>'invited' OR invite.expires_at<=now() OR identity_email<>invite.email THEN
    RAISE EXCEPTION 'This invitation is unavailable for the signed-in account' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.admin_profiles(user_id,property_id,role,display_name,team_preset,team_permissions,team_email)
    VALUES(auth.uid(),invite.property_id,'staff',invite.display_name,invite.preset,invite.permissions,identity_email);
  UPDATE public.team_invitations SET state='accepted' WHERE id=invite.id;
  INSERT INTO public.team_access_audit(property_id,actor,target,action,details) VALUES(
    invite.property_id,auth.uid(),auth.uid(),'activate',jsonb_build_object('invitation',invite.id,'permissions',invite.permissions));
  RETURN invite.property_id;
END $$;

REVOKE ALL ON FUNCTION public.team_directory(uuid),public.team_manage(uuid,text,uuid,jsonb),public.team_accept(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.team_directory(uuid),public.team_manage(uuid,text,uuid,jsonb),public.team_accept(uuid) TO authenticated;

-- Restricted memberships use projections, never broad table grants.
CREATE OR REPLACE FUNCTION public.team_workspace(target_property uuid, area text, subject text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
  IF area IN ('bookings.view','bookings.export') AND public.team_has_permission(target_property,area) THEN
    SELECT jsonb_agg(to_jsonb(t) ORDER BY t.check_in DESC NULLS LAST) INTO result FROM (
      SELECT b.id,b.reference,b.check_in,b.check_out,b.booking_status,b.payment_status,b.total_guests,
        CASE WHEN public.team_has_permission(target_property,'bookings.contacts') THEN
          (SELECT jsonb_agg(jsonb_build_object('name',concat_ws(' ',g.first_name,g.last_name),'email',g.email,'phone',g.phone))
            FROM public.booking_guests g WHERE g.booking_id=b.id) END AS guest_contacts
      FROM public.bookings b WHERE b.property_id=target_property AND b.booking_status<>'held'
      ORDER BY b.check_in DESC NULLS LAST,b.id LIMIT CASE WHEN area='bookings.export' THEN 2000 ELSE 100 END
    ) t;
  ELSIF area='availability.manage' AND public.team_has_permission(target_property,area) THEN
    SELECT jsonb_build_object(
      'rooms',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'title',coalesce(r.title,r.room_number)))
        FROM public.rooms r WHERE r.property_id=target_property AND r.status='published' AND r.active),'[]'::jsonb),
      'blocks',coalesce((SELECT jsonb_agg(to_jsonb(ab)) FROM (
        SELECT id,room_id,start_date,end_date,source FROM public.availability_blocks
        WHERE property_id=target_property AND status='published' AND end_date>=current_date
        ORDER BY start_date LIMIT 200
      ) ab),'[]'::jsonb),
      'occupancy',coalesce((SELECT jsonb_agg(to_jsonb(rr)) FROM (
        SELECT room_id,check_in,check_out,booking_status FROM public.room_reservations
        WHERE property_id=target_property AND check_out>=current_date
          AND booking_status IN ('pending','confirmed','awaiting_payment','checked_in','held')
          AND (booking_status<>'held' OR hold_expires_at>now())
        ORDER BY check_in LIMIT 200
      ) rr),'[]'::jsonb)
    ) INTO result;
  ELSIF area IN ('rooms.content','rooms.capacity','rates.manage') AND public.team_has_permission(target_property,area) THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id',r.id,'name',r.name,
      'short_description',CASE WHEN area='rooms.content' THEN r.short_description END,
      'long_description',CASE WHEN area='rooms.content' THEN r.long_description END,
      'capacity',CASE WHEN area='rooms.capacity' THEN r.max_total_occupancy END,
      'max_adults',CASE WHEN area='rooms.capacity' THEN r.max_adults END,
      'max_children',CASE WHEN area='rooms.capacity' THEN r.max_children END,
      'max_infants',CASE WHEN area='rooms.capacity' THEN r.max_infants END,
      'min_adults',CASE WHEN area='rooms.capacity' THEN r.min_adults END,
      'base_occupancy',CASE WHEN area='rooms.capacity' THEN r.base_occupancy END,
      'infants_count',CASE WHEN area='rooms.capacity' THEN r.infants_count_toward_capacity END,
      'media',CASE WHEN area='rooms.content' THEN coalesce((SELECT jsonb_agg(ri.media_asset_id)
        FROM public.room_images ri WHERE ri.property_id=target_property AND ri.room_type_id=r.id AND ri.status='published'),'[]'::jsonb) END,
      'amenities',CASE WHEN area='rooms.content' THEN coalesce((SELECT jsonb_agg(ra.amenity_id)
        FROM public.room_type_amenities ra WHERE ra.property_id=target_property AND ra.room_type_id=r.id),'[]'::jsonb) END,
      'rate',CASE WHEN area='rates.manage' THEN (SELECT jsonb_build_object('price',x.base_price,'currency',x.currency,'active',x.active)
        FROM public.rates x WHERE x.property_id=target_property AND x.room_type_id=r.id AND x.status<>'archived' LIMIT 1) END
    ) ORDER BY r.name) INTO result FROM public.room_types r WHERE r.property_id=target_property AND r.status<>'archived';
  ELSIF area='approved_media' AND (public.team_has_permission(target_property,'rooms.content') OR public.team_has_permission(target_property,'website.draft')) THEN
    SELECT jsonb_agg(to_jsonb(m)) INTO result FROM (
      SELECT id,coalesce(title,filename) AS name FROM public.media_assets
      WHERE property_id=target_property AND status='published' AND is_visible ORDER BY created_at DESC LIMIT 100
    ) m;
  ELSIF area='approved_amenities' AND public.team_has_permission(target_property,'rooms.content') THEN
    SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a.name) ORDER BY a.name) INTO result
      FROM public.amenities a WHERE a.property_id=target_property AND a.status<>'archived' AND a.active;
  ELSIF area='website.draft' AND public.team_has_permission(target_property,area) THEN
    SELECT jsonb_agg(to_jsonb(d) ORDER BY d.document_key) INTO result FROM (
      SELECT c.document_key,c.data->>f.key AS live_copy,c.draft_data->>f.key AS draft_copy,c.status,c.draft_data IS NOT NULL AS has_draft
      FROM public.cms_documents c CROSS JOIN LATERAL (SELECT CASE WHEN c.document_key IN ('contact','about') THEN 'introduction'
        WHEN c.document_key='rooms' THEN 'introDescription' ELSE 'description' END AS key) f
      WHERE c.property_id=target_property AND (subject IS NULL OR c.document_key=subject)
    ) d;
  ELSIF area='offers.manage' AND public.team_has_permission(target_property,area) THEN
    SELECT jsonb_agg(to_jsonb(t) ORDER BY t.name) INTO result FROM (
      SELECT 'experience' AS kind,id,name,short_description FROM public.experiences WHERE property_id=target_property AND status<>'archived'
      UNION ALL SELECT 'transfer',id,concat_ws(' → ',origin,destination),short_description FROM public.transfer_routes
      WHERE property_id=target_property AND status<>'archived'
    ) t;
  ELSE RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';
  END IF;
  RETURN coalesce(result,'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.team_workspace_write(target_property uuid, operation text, target uuid, payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE required text; item uuid; field text; doc text; edit jsonb; nights integer;
  total integer; adult_limit integer; child_limit integer; infant_limit integer; minimum integer; base integer;
BEGIN
  required:=CASE operation WHEN 'block' THEN 'availability.manage' WHEN 'reopen' THEN 'availability.manage'
    WHEN 'room_content' THEN 'rooms.content' WHEN 'room_capacity' THEN 'rooms.capacity'
    WHEN 'rate' THEN 'rates.manage' WHEN 'draft' THEN 'website.draft' WHEN 'publish' THEN 'website.publish'
    WHEN 'offer' THEN 'offers.manage' WHEN 'booking_status' THEN 'bookings.manage' END;
  PERFORM 1 FROM public.admin_profiles p WHERE p.property_id=target_property AND p.user_id=auth.uid()
    AND p.is_active AND required=ANY(p.team_permissions) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
  IF operation='block' THEN
    nights:=(payload->>'end')::date-(payload->>'start')::date;
    IF nights IS NULL OR nights<0 OR nights>366 OR NOT EXISTS(SELECT 1 FROM public.rooms
      WHERE id=target AND property_id=target_property AND active AND status='published') THEN
      RAISE EXCEPTION 'Choose an active room and valid dates' USING ERRCODE='22023';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext(target_property::text));
    IF EXISTS(SELECT 1 FROM public.availability_blocks WHERE property_id=target_property AND room_id=target
      AND status='published' AND start_date<=(payload->>'end')::date AND end_date>=(payload->>'start')::date) THEN
      RAISE EXCEPTION 'An existing block overlaps these dates' USING ERRCODE='23P01';
    END IF;
    INSERT INTO public.availability_blocks(property_id,room_id,start_date,end_date,source,status,reason_code,created_by,updated_by)
      VALUES(target_property,target,(payload->>'start')::date,(payload->>'end')::date,'manual','published','maintenance',auth.uid(),auth.uid());
  ELSIF operation='reopen' THEN
    UPDATE public.availability_blocks SET status='archived',archived_at=now(),updated_by=auth.uid()
      WHERE property_id=target_property AND id=target AND source='manual' AND status='published';
    IF NOT FOUND THEN RAISE EXCEPTION 'Manual block unavailable' USING ERRCODE='22023'; END IF;
  ELSIF operation='room_content' THEN
    IF coalesce(length(payload->>'short'),0)>1000 OR coalesce(length(payload->>'long'),0)>10000 THEN
      RAISE EXCEPTION 'Room description is too long' USING ERRCODE='22023';
    END IF;
    UPDATE public.room_types SET short_description=payload->>'short',description=payload->>'short',
      long_description=payload->>'long',updated_by=auth.uid()
      WHERE property_id=target_property AND id=target AND status<>'archived';
    IF NOT FOUND THEN RAISE EXCEPTION 'Room unavailable' USING ERRCODE='22023'; END IF;
    IF nullif(payload->>'media','') IS NOT NULL THEN
      item:=(payload->>'media')::uuid;
      IF NOT EXISTS(SELECT 1 FROM public.media_assets WHERE id=item AND property_id=target_property AND status='published' AND is_visible) THEN
        RAISE EXCEPTION 'Select approved property media' USING ERRCODE='22023';
      END IF;
      INSERT INTO public.room_images(property_id,room_type_id,media_asset_id,sort_order,status,is_visible,created_by,updated_by)
        SELECT target_property,target,item,coalesce(max(sort_order),-10)+10,'published',true,auth.uid(),auth.uid()
        FROM public.room_images WHERE room_type_id=target AND property_id=target_property
        ON CONFLICT(room_type_id,media_asset_id) DO UPDATE SET status='published',is_visible=true,archived_at=NULL,updated_by=auth.uid();
    END IF;
    IF payload ? 'amenities' THEN
      IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(payload->'amenities') j(id) WHERE NOT EXISTS(
        SELECT 1 FROM public.amenities a WHERE a.id=j.id::uuid AND a.property_id=target_property AND a.active AND a.status<>'archived')) THEN
        RAISE EXCEPTION 'Choose property amenities' USING ERRCODE='22023';
      END IF;
      DELETE FROM public.room_type_amenities WHERE property_id=target_property AND room_type_id=target;
      INSERT INTO public.room_type_amenities(property_id,room_type_id,amenity_id,created_by)
        SELECT DISTINCT target_property,target,j.id::uuid,auth.uid() FROM jsonb_array_elements_text(payload->'amenities') j(id);
    END IF;
  ELSIF operation='room_capacity' THEN
    total:=(payload->>'total')::integer; adult_limit:=(payload->>'adults')::integer; child_limit:=(payload->>'children')::integer;
    infant_limit:=(payload->>'infants')::integer; minimum:=(payload->>'minimum')::integer; base:=(payload->>'base')::integer;
    IF total IS NULL OR adult_limit IS NULL OR child_limit IS NULL OR infant_limit IS NULL OR minimum IS NULL OR base IS NULL
      OR total<1 OR adult_limit NOT BETWEEN 1 AND total OR child_limit NOT BETWEEN 0 AND total OR infant_limit<0
      OR (coalesce((payload->>'infantsCount')::boolean,true) AND infant_limit>total)
      OR minimum NOT BETWEEN 1 AND adult_limit OR base NOT BETWEEN 1 AND total THEN
      RAISE EXCEPTION 'Enter valid occupancy limits' USING ERRCODE='22023';
    END IF;
    UPDATE public.room_types SET capacity=total,adults=adult_limit,children=0,max_total_occupancy=total,max_adults=adult_limit,max_children=child_limit,
      max_infants=infant_limit,min_adults=minimum,base_occupancy=base,infants_count_toward_capacity=coalesce((payload->>'infantsCount')::boolean,true),updated_by=auth.uid()
      WHERE property_id=target_property AND id=target AND status<>'archived';
    IF NOT FOUND THEN RAISE EXCEPTION 'Room unavailable' USING ERRCODE='22023'; END IF;
  ELSIF operation='rate' THEN
    IF coalesce(payload->>'price','') !~ '^\d{1,8}(\.\d{1,2})?$' OR coalesce(payload->>'currency','') NOT IN ('EUR','USD','GBP','ALL')
       OR NOT EXISTS(SELECT 1 FROM public.room_types WHERE id=target AND property_id=target_property AND status<>'archived') THEN
      RAISE EXCEPTION 'Enter a valid rate and room' USING ERRCODE='22023';
    END IF;
    INSERT INTO public.rates(property_id,room_type_id,title,base_price,currency,active,status,is_visible,created_by,updated_by)
      VALUES(target_property,target,'Base rate',(payload->>'price')::numeric,payload->>'currency',coalesce((payload->>'active')::boolean,false),'published',true,auth.uid(),auth.uid())
      ON CONFLICT(property_id,room_type_id) WHERE status<>'archived' DO UPDATE SET base_price=excluded.base_price,
      currency=excluded.currency,active=excluded.active,status='published',is_visible=true,updated_by=auth.uid();
  ELSIF operation='offer' THEN
    IF coalesce(length(payload->>'description'),0) NOT BETWEEN 1 AND 1000 THEN
      RAISE EXCEPTION 'Enter an offer description' USING ERRCODE='22023'; END IF;
    IF payload->>'kind'='experience' THEN
      UPDATE public.experiences SET short_description=payload->>'description',updated_by=auth.uid()
        WHERE id=target AND property_id=target_property AND status<>'archived';
    ELSIF payload->>'kind'='transfer' THEN
      UPDATE public.transfer_routes SET short_description=payload->>'description',updated_by=auth.uid()
        WHERE id=target AND property_id=target_property AND status<>'archived';
    ELSE RAISE EXCEPTION 'Unknown offer' USING ERRCODE='22023'; END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'Offer unavailable' USING ERRCODE='22023'; END IF;
  ELSIF operation='booking_status' THEN
    UPDATE public.bookings SET booking_status='cancelled',status='cancelled',updated_by=auth.uid()
      WHERE id=target AND property_id=target_property AND booking_status IN ('pending','confirmed','awaiting_payment')
        AND payload->>'status'='cancelled';
    IF NOT FOUND THEN RAISE EXCEPTION 'Reservation cannot be cancelled in this workspace' USING ERRCODE='22023'; END IF;
  ELSE
    doc:=payload->>'key';
    field:=CASE doc WHEN 'contact' THEN 'introduction' WHEN 'about' THEN 'introduction'
      WHEN 'rooms' THEN 'introDescription' WHEN 'gallery' THEN 'description'
      WHEN 'experiences' THEN 'description' WHEN 'transfers' THEN 'description'
      WHEN 'explore-koman' THEN 'description' WHEN 'book' THEN 'description' WHEN 'footer' THEN 'description' END;
    IF field IS NULL THEN RAISE EXCEPTION 'Choose an available page' USING ERRCODE='22023'; END IF;
    IF operation='draft' THEN
      IF coalesce(length(payload->>'copy'),0)>4000 THEN RAISE EXCEPTION 'Page text is too long' USING ERRCODE='22023'; END IF;
      edit:=jsonb_build_object(field,coalesce(payload->>'copy',''));
      IF nullif(payload->>'media','') IS NOT NULL THEN
        item:=(payload->>'media')::uuid;
        IF doc NOT IN ('experiences','transfers','explore-koman') OR NOT EXISTS(SELECT 1 FROM public.media_assets WHERE id=item
          AND property_id=target_property AND status='published' AND is_visible) OR coalesce(length(payload->>'alt'),0)<3 THEN
          RAISE EXCEPTION 'Select approved property media and write alternative text' USING ERRCODE='22023';
        END IF;
        edit:=edit||jsonb_build_object('heroImageId',item,'heroImageAlt',payload->>'alt');
      END IF;
      INSERT INTO public.cms_documents(property_id,document_key,data,draft_data,status,created_by,updated_by)
        VALUES(target_property,doc,'{}',edit,'draft',auth.uid(),auth.uid())
        ON CONFLICT(property_id,document_key) DO UPDATE SET draft_data=public.cms_documents.data||coalesce(public.cms_documents.draft_data,'{}')||edit,updated_by=auth.uid();
    ELSE
      UPDATE public.cms_documents SET data=data||draft_data,draft_data=NULL,status='published',updated_by=auth.uid()
        WHERE property_id=target_property AND document_key=doc AND draft_data IS NOT NULL;
      IF NOT FOUND THEN RAISE EXCEPTION 'Save a draft before publishing' USING ERRCODE='22023'; END IF;
    END IF;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.team_workspace(uuid,text,text),public.team_workspace_write(uuid,text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.team_workspace(uuid,text,text),public.team_workspace_write(uuid,text,uuid,jsonb) TO authenticated;

COMMIT;
