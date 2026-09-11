-- Public-site readiness: database-backed contact enquiries.

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) <= 320),
  phone TEXT,
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 120),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_inquiries_property_status_idx
  ON public.contact_inquiries(property_id,status,created_at DESC);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_inquiries_admin_read ON public.contact_inquiries;
CREATE POLICY contact_inquiries_admin_read ON public.contact_inquiries
  FOR SELECT TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]));
DROP POLICY IF EXISTS contact_inquiries_admin_update ON public.contact_inquiries;
CREATE POLICY contact_inquiries_admin_update ON public.contact_inquiries
  FOR UPDATE TO authenticated
  USING(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]))
  WITH CHECK(public.can_manage_property(property_id,ARRAY['owner','manager','staff']::public.admin_role[]));

DROP TRIGGER IF EXISTS set_contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER set_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.submit_contact_inquiry(
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  inquiry_subject TEXT,
  inquiry_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  target_property UUID;
  inquiry_id UUID;
BEGIN
  SELECT id INTO target_property
  FROM public.properties
  WHERE status='published'
  ORDER BY created_at
  LIMIT 1;

  IF target_property IS NULL THEN
    RAISE EXCEPTION 'Contact is not configured' USING ERRCODE='55000';
  END IF;
  IF char_length(trim(COALESCE(sender_name,''))) NOT BETWEEN 2 AND 120
     OR lower(trim(COALESCE(sender_email,''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR char_length(trim(COALESCE(inquiry_subject,''))) NOT BETWEEN 2 AND 120
     OR char_length(trim(COALESCE(inquiry_message,''))) NOT BETWEEN 10 AND 5000 THEN
    RAISE EXCEPTION 'Invalid contact enquiry' USING ERRCODE='22023';
  END IF;
  IF (
    SELECT count(*) FROM public.contact_inquiries
    WHERE property_id=target_property
      AND lower(email)=lower(trim(sender_email))
      AND created_at>NOW()-INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many contact enquiries' USING ERRCODE='54000';
  END IF;

  INSERT INTO public.contact_inquiries(property_id,name,email,phone,subject,message)
  VALUES(
    target_property,
    trim(sender_name),
    lower(trim(sender_email)),
    NULLIF(trim(COALESCE(sender_phone,'')),''),
    trim(inquiry_subject),
    trim(inquiry_message)
  ) RETURNING id INTO inquiry_id;

  RETURN inquiry_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_contact_inquiry(TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_inquiry(TEXT,TEXT,TEXT,TEXT,TEXT) TO anon,authenticated;

