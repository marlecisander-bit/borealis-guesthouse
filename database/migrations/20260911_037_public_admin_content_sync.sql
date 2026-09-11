-- Complete the public/editorial CMS mapping without moving domain data into
-- Website Content. Existing document values always win over these defaults.

ALTER TABLE public.cms_documents DROP CONSTRAINT IF EXISTS cms_documents_document_key_check;
ALTER TABLE public.cms_documents ADD CONSTRAINT cms_documents_document_key_check
  CHECK(document_key IN (
    'rooms','experiences','transfers','explore-koman','about','gallery',
    'contact','book','global','footer'
  ));

INSERT INTO public.cms_documents(property_id,document_key,data,status,published_at)
SELECT p.id,seed.document_key,seed.data,'published',NOW()
FROM public.properties p
CROSS JOIN (VALUES
  ('book',jsonb_build_object(
    'eyebrow','Book direct',
    'heading','Your Koman stay, made simple.',
    'description','Choose your room, add anything useful and review everything clearly before confirming.'
  )),
  ('global',jsonb_build_object(
    'headerCtaLabel','Book now',
    'mobileMenuCtaLabel','Check availability',
    'mobileBarCtaLabel','Check availability',
    'sharedCtaEyebrow','Plan your stay',
    'sharedCtaHeading','Your place by the lake is waiting.',
    'sharedCtaLabel','Check availability',
    'sharedCtaTarget','/book'
  ))
) AS seed(document_key,data)
ON CONFLICT(property_id,document_key) DO NOTHING;

UPDATE public.cms_documents
SET data=jsonb_build_object(
  'directHeading','Talk to us directly.',
  'directDescription','Contact details are managed centrally in Borealis CMS.',
  'addressLabel','Address',
  'directionsText',''
)||data
WHERE document_key='contact';

UPDATE public.cms_documents
SET data=jsonb_build_object(
  'ctaLabel','Check availability',
  'ctaTarget','/book'
)||data
WHERE document_key='about';

UPDATE public.cms_documents
SET data=jsonb_build_object(
  'exploreHeading','Explore',
  'findUsHeading','Find us',
  'bookingCtaLabel','Book your stay',
  'bookingCtaTarget','/book'
)||data
WHERE document_key='footer';

UPDATE public.cms_documents SET data=jsonb_build_object(
  'detailEyebrow','The room','detailHeading','A calm place to come back to.',
  'relatedEyebrow','More ways to stay','relatedHeading','Other rooms at Borealis.',
  'relatedLinkLabel','View all rooms'
)||data WHERE document_key='rooms';

UPDATE public.cms_documents SET data=jsonb_build_object(
  'detailEyebrow','The experience','detailHeading','Time well spent in Koman.',
  'relatedEyebrow','Make a stay of it','relatedHeading','Come back to comfort.',
  'relatedDescription','Pair your time outside with a quiet room by the lake.',
  'relatedLinkLabel','Explore all rooms'
)||data WHERE document_key='experiences';

UPDATE public.cms_documents SET data=jsonb_build_object(
  'detailEyebrow','Route details','detailHeading','A straightforward journey.'
)||data WHERE document_key='transfers';

-- Ensure every currently rendered homepage section has a real CMS record.
-- Existing owner-authored sections are never replaced.
INSERT INTO public.homepage_sections(
  property_id,section_key,title,subtitle,body,eyebrow,cta_label,cta_link,
  settings,status,is_visible,sort_order,published_at
)
SELECT p.id,seed.section_key,seed.title,NULL,seed.body,seed.eyebrow,
  seed.cta_label,seed.cta_link,seed.settings,'published',TRUE,
  seed.sort_order,NOW()
FROM public.properties p
CROSS JOIN (VALUES
  ('hero','Wake up by the water.','A lakeside stay in the heart of Koman.','Borealis Guest House · Koman, Albania',NULL::TEXT,NULL::TEXT,jsonb_build_object('showBookingSearch',TRUE,'bookingCtaLabel','Check availability','imageAlt','Koman Lake surrounded by mountain slopes'),0),
  ('intro','Close to nature. Warm by design.','A small lakeside guesthouse for restful rooms, generous breakfasts and days that unfold on the water.','Welcome to Borealis','Our story','/about',jsonb_build_object('imageAlt','A peaceful terrace surrounded by nature','imageLabel','Slow mornings · Open air'),20),
  ('featured_rooms','Our Rooms','Natural textures, quiet comfort and the lake always close by.','Stay at Borealis','See all rooms','/rooms','{}'::jsonb,30),
  ('featured_experiences','The lake is only the beginning.','Paddle quiet coves, travel hidden shores and see the landscape with local perspective.','Experience Koman','View experiences','/experiences','{}'::jsonb,40),
  ('explore_koman','A destination worth staying for.','Travel notes for Koman Lake, the Shala River, the ferry and the mountain paths beyond the shore.','Explore Koman','Explore Koman','/explore-koman','{}'::jsonb,50),
  ('transfers','Arrive easily. Leave the logistics to us.','Plan connections from Tirana Airport, Shkoder and local lake destinations.','Transfers to Borealis','View transfers','/transfers','{}'::jsonb,60),
  ('gallery','Life beside the lake.','', 'The visual story','Open gallery','/gallery','{}'::jsonb,70),
  ('reviews','The feeling stays with you.','Manual testimonial content supplied by Borealis.','Guest notes',NULL,NULL,'{}'::jsonb,80),
  ('location','At the edge of the water.','Borealis is set in Koman, a mountain gateway known for its lake journeys and dramatic northern Albanian landscape.','Koman, Albania','Contact & directions','/contact','{}'::jsonb,90),
  ('final_cta','Your stay in Koman starts here.','', 'Book direct','Check availability','/book',jsonb_build_object('imageAlt','Mountain lake in Koman'),100)
) AS seed(section_key,title,body,eyebrow,cta_label,cta_link,settings,sort_order)
ON CONFLICT(property_id,section_key) DO NOTHING;
