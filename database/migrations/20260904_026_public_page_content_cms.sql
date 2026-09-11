-- Extend the existing cms_documents draft/publish system to all primary
-- landing pages. Content only: layout and styling remain in Next.js.

ALTER TABLE public.cms_documents DROP CONSTRAINT IF EXISTS cms_documents_document_key_check;
ALTER TABLE public.cms_documents ADD CONSTRAINT cms_documents_document_key_check
  CHECK(document_key IN ('rooms','experiences','transfers','explore-koman','about','gallery','contact','footer'));

INSERT INTO public.cms_documents(property_id,document_key,data,status,published_at)
SELECT p.id,seed.document_key,seed.data,'published',NOW()
FROM public.properties p
CROSS JOIN (VALUES
  ('rooms',jsonb_build_object(
    'eyebrow','Stay at Borealis',
    'heading','Rooms made for slower mornings.',
    'description','Thoughtful comfort, natural textures and the landscape just beyond your window.',
    'heroImageId','',
    'heroImageAlt','A warm Borealis guest room',
    'introEyebrow','Choose your room',
    'introHeading','Space to settle in.',
    'introDescription',''
  )),
  ('experiences',jsonb_build_object(
    'eyebrow','Experience Koman',
    'heading','Let the landscape lead.',
    'description','Time on the water, local perspectives and slower ways to discover the nature around Borealis.',
    'heroImageId','',
    'heroImageAlt','Experience the landscape around Koman',
    'introEyebrow','Choose your experience',
    'introHeading','More than a place to stay.',
    'introDescription','Choose from the experiences currently published by Borealis.',
    'ctaEyebrow','Add to your stay',
    'ctaHeading','Already choosing a room?',
    'ctaDescription','Experiences can be requested independently or added while creating a room booking.',
    'ctaLabel','Start a booking',
    'ctaTarget','/book'
  )),
  ('transfers',jsonb_build_object(
    'eyebrow','Transfers by Borealis',
    'heading','The simple way to reach the lake.',
    'description','Request a transfer as part of your stay, with one clear journey from pickup to Borealis—or onward to your next destination.',
    'heroImageId','',
    'heroImageAlt','Journey to Borealis Guest House',
    'introEyebrow','Available routes',
    'introHeading','Choose where you are coming from.',
    'introDescription','Browse current routes, journey details and prices managed directly by Borealis.',
    'processEyebrow','How it will work',
    'processHeading','A clearer arrival.',
    'processStep1Title','Choose a route',
    'processStep1Description','Select the connection that fits your journey.',
    'processStep2Title','Add your details',
    'processStep2Description','Share timing and passenger information.',
    'processStep3Title','Receive confirmation',
    'processStep3Description','Final service details will be confirmed directly.',
    'ctaEyebrow','Travelling a different route?',
    'ctaHeading','Tell us where you need to go.',
    'ctaDescription','The route model supports additional origins and destinations. Ask about a connection that is not listed yet.',
    'ctaLabel','Request another route',
    'ctaTarget','/contact'
  )),
  ('explore-koman',jsonb_build_object(
    'eyebrow','The local guide',
    'heading','Koman is more than a crossing.',
    'description','Practical notes and slower stories for travellers who want to understand this remarkable corner of Albania.',
    'heroImageId','',
    'heroImageAlt','The landscape around Koman, Albania',
    'introEyebrow','Field notes',
    'introHeading','Know before you go.',
    'introDescription',''
  )),
  ('gallery',jsonb_build_object(
    'eyebrow','The visual story',
    'heading','A sense of life by the lake.',
    'description','Rooms, water, mountain paths and quiet outdoor moments—an evolving visual journal of Borealis.',
    'heroImageId','',
    'heroImageAlt','Borealis Guest House and its surroundings',
    'introEyebrow','Borealis in pictures',
    'introHeading','Look a little closer.',
    'introDescription','Select an image to open the full gallery. Swipe on touch screens or use the arrow keys.'
  )),
  ('about',jsonb_build_object(
    'heroEyebrow','Our story',
    'heroTitle','A guesthouse shaped by its surroundings.',
    'introduction','Borealis is being created around the quiet character of Koman: water, mountain light and a warm sense of welcome.',
    'heroImage','',
    'heroImageAlt','Borealis Guest House by the lake',
    'storyEyebrow','The property story',
    'storyHeading','Small in scale. Personal by nature.',
    'storyText','Borealis is imagined as a calm home beside the lake, where thoughtful rooms and an unhurried atmosphere keep the landscape at the centre of the stay.',
    'storyImage','',
    'storyImageAlt','Warm guest room with natural materials',
    'locationEyebrow','The location',
    'locationHeading','A base for the lake and beyond.',
    'locationText','From Borealis, guests can plan rooms, transfers and local experiences through one connected place.',
    'locationImage','',
    'locationImageAlt','Quiet outdoor setting surrounded by nature',
    'philosophyEyebrow','Hospitality philosophy',
    'philosophyHeading','Thoughtful, never formal.',
    'philosophy',E'A sincere, personal welcome\nComfort without unnecessary formality\nLocal guidance with room to explore independently'
  )),
  ('contact',jsonb_build_object(
    'eyebrow','Contact Borealis',
    'title','Let us help with the journey.',
    'introduction','Ask about a room, an experience, a transfer or the best way to reach us in Koman.',
    'address','Koman, Albania',
    'journeyEyebrow','How to reach Borealis',
    'journeyHeading','Plan the final part of your journey.',
    'journeyDescription','Koman connections can vary by route and season. Contact us for current directions, or explore the transfer services being prepared for guests.',
    'primaryCtaLabel','View transfers',
    'primaryCtaTarget','/transfers',
    'secondaryCtaLabel','Check availability',
    'secondaryCtaTarget','/book'
  )),
  ('footer',jsonb_build_object(
    'description','A boutique lakeside guesthouse for quiet stays, local journeys and unhurried time in Koman, Albania.',
    'copyright','© Borealis Guest House'
  ))
) AS seed(document_key,data)
ON CONFLICT(property_id,document_key) DO NOTHING;

-- Seed the existing homepage welcome block so it is editable without changing
-- the current public appearance. Existing owner content always wins.
INSERT INTO public.homepage_sections(
  property_id,section_key,title,body,eyebrow,cta_label,cta_link,
  settings,status,is_visible,sort_order,published_at
)
SELECT
  p.id,'intro','Close to nature. Warm by design.',
  'A small lakeside guesthouse for restful rooms, generous breakfasts and days that unfold on the water.',
  'Welcome to Borealis','Our story','/about',
  jsonb_build_object(
    'imageAlt','A peaceful terrace surrounded by nature',
    'imageLabel','Slow mornings · Open air'
  ),
  'published',TRUE,20,NOW()
FROM public.properties p
ON CONFLICT(property_id,section_key) DO UPDATE SET
  title=COALESCE(NULLIF(homepage_sections.title,''),EXCLUDED.title),
  body=COALESCE(NULLIF(homepage_sections.body,''),EXCLUDED.body),
  eyebrow=COALESCE(NULLIF(homepage_sections.eyebrow,''),EXCLUDED.eyebrow),
  cta_label=COALESCE(NULLIF(homepage_sections.cta_label,''),EXCLUDED.cta_label),
  cta_link=COALESCE(NULLIF(homepage_sections.cta_link,''),EXCLUDED.cta_link),
  settings=EXCLUDED.settings||COALESCE(homepage_sections.settings,'{}'::jsonb);

-- Add the remaining visible page copy to existing documents without replacing
-- any content the owner has already entered.
UPDATE public.cms_documents
SET data=jsonb_build_object(
  'heroEyebrow','Our story',
  'heroImageAlt','Borealis Guest House by the lake',
  'storyEyebrow','Our story',
  'storyImageAlt','Borealis Guest House',
  'locationEyebrow','Koman',
  'locationImageAlt','Koman landscape',
  'philosophyEyebrow','Hospitality philosophy',
  'philosophyHeading','Thoughtful, never formal.'
)||data
WHERE document_key='about';

UPDATE public.cms_documents
SET data=jsonb_build_object(
  'eyebrow','Contact Borealis',
  'title','Let us help with the journey.',
  'introduction','Ask about a room, an experience, a transfer or the best way to reach us in Koman.',
  'journeyEyebrow','How to reach Borealis',
  'journeyHeading','Plan the final part of your journey.',
  'journeyDescription','Koman connections can vary by route and season. Contact us for current directions, or explore the transfer services being prepared for guests.',
  'primaryCtaLabel','View transfers',
  'primaryCtaTarget','/transfers',
  'secondaryCtaLabel','Check availability',
  'secondaryCtaTarget','/book'
)||data
WHERE document_key='contact';
