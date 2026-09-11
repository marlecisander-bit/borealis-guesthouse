import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AdminPageHeader} from '@/components/admin/ui';
import {SiteDocumentForm} from '@/components/admin/SiteDocumentForm';
import {requireAdmin} from '@/lib/admin/auth';
import {isLandingPageKey} from '@/lib/landing-page-content';
import {adminMediaRepository} from '@/lib/repositories/admin/media';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

type Field={name:string;label:string;kind?:'text'|'textarea'|'url'|'email'|'image';help?:string};
const common:Field[]=[
  {name:'eyebrow',label:'Eyebrow'},
  {name:'heading',label:'Heading'},
  {name:'description',label:'Description',kind:'textarea'},
  {name:'heroImageId',label:'Hero image',kind:'image',help:'Select or upload an image from the central Media Library.'},
  {name:'heroImageAlt',label:'Hero image alternative text',help:'Briefly describe the image for visitors using assistive technology.'},
  {name:'introEyebrow',label:'Introduction eyebrow'},
  {name:'introHeading',label:'Introduction heading'},
  {name:'introDescription',label:'Introduction description',kind:'textarea'},
];
const cta:Field[]=[
  {name:'ctaEyebrow',label:'CTA eyebrow'},
  {name:'ctaHeading',label:'CTA heading'},
  {name:'ctaDescription',label:'CTA description',kind:'textarea'},
  {name:'ctaLabel',label:'CTA button label'},
  {name:'ctaTarget',label:'CTA destination',help:'Use a safe internal path such as /book or /contact.'},
];
const process:Field[]=[
  {name:'processEyebrow',label:'Process eyebrow'},
  {name:'processHeading',label:'Process heading'},
  {name:'processStep1Title',label:'Step 1 title'},
  {name:'processStep1Description',label:'Step 1 description',kind:'textarea'},
  {name:'processStep2Title',label:'Step 2 title'},
  {name:'processStep2Description',label:'Step 2 description',kind:'textarea'},
  {name:'processStep3Title',label:'Step 3 title'},
  {name:'processStep3Description',label:'Step 3 description',kind:'textarea'},
];
const detail:Field[]=[
  {name:'detailEyebrow',label:'Detail page description eyebrow'},
  {name:'detailHeading',label:'Detail page description heading'},
];
const related:Field[]=[
  {name:'relatedEyebrow',label:'Detail page related-content eyebrow'},
  {name:'relatedHeading',label:'Detail page related-content heading'},
  {name:'relatedDescription',label:'Detail page related-content description',kind:'textarea'},
  {name:'relatedLinkLabel',label:'Detail page related-content link label'},
];
const config={
  rooms:{label:'Rooms',description:'Edit the Rooms landing page and shared room-detail headings. Individual rooms remain in Admin → Rooms.',fields:[...common,...detail,...related.filter(field=>field.name!=='relatedDescription')]},
  experiences:{label:'Experiences',description:'Edit the Experiences landing page and shared detail-page sections. Individual experiences remain in Admin → Experiences.',fields:[...common,...cta,...detail,...related]},
  transfers:{label:'Transfers',description:'Edit the Transfers landing page and shared route-detail headings. Individual routes remain in Admin → Transfers.',fields:[...common,...process,...cta,...detail]},
  'explore-koman':{label:'Explore Koman',description:'Edit the guide landing-page hero and introduction. Articles remain in the Explore Koman CMS.',fields:common},
  gallery:{label:'Gallery',description:'Edit the Gallery landing-page presentation. Individual photographs remain in the Media Library.',fields:common},
} as const;

export default async function ContentSectionPage({params}:{params:Promise<{section:string}>}){
  const session=await requireAdmin(['owner','manager','editor']);
  const{section}=await params;
  if(!isLandingPageKey(section))notFound();
  const page=config[section];
  const[document,assets]=await Promise.all([adminSiteContentRepository.document(session,section),adminMediaRepository.list(session).catch(()=>[])]);
  const media=assets.filter(asset=>asset.status!=='archived').map(asset=>({id:asset.id,label:asset.title||asset.alt_text||asset.filename||'Untitled image',imageUrl:asset.publicUrl}));
  return <div className="space-y-8">
    <AdminPageHeader title={`${page.label} content`} description={page.description} actions={<Link href={`/${section}`} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Preview Website</Link>}/>
    <SiteDocumentForm documentKey={section} fields={[...page.fields]} data={document.data} media={media}/>
  </div>;
}
