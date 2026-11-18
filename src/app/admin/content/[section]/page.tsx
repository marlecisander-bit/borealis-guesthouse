import Link from 'next/link';
import {notFound} from 'next/navigation';
import {WebsiteEditorHeader,websiteShortcut} from '@/components/admin/WebsiteEditorHeader';
import {SiteDocumentForm} from '@/components/admin/SiteDocumentForm';
import {requireAdmin} from '@/lib/admin/auth';
import {isLandingPageKey} from '@/lib/landing-page-content';
import {adminMediaRepository} from '@/lib/repositories/admin/media';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

type Field={name:string;label:string;kind?:'text'|'textarea'|'url'|'email'|'image'|'hero';help?:string};
const common:Field[]=[
  {name:'eyebrow',label:'Eyebrow'},
  {name:'heading',label:'Heading'},
  {name:'description',label:'Description',kind:'textarea'},
  {name:'heroImageId',label:'Hero images',kind:'hero',help:'Select or upload an image from the central Media Library.'},
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
  const[document,assets]=await Promise.all([adminSiteContentRepository.document(session,section),adminMediaRepository.options(session).catch(()=>[])]);
  const media=assets.filter(asset=>asset.status!=='archived').map(asset=>({id:asset.id,label:asset.title||asset.alt_text||asset.filename||'Untitled image',imageUrl:asset.publicUrl}));
  const roomSections = [
    { id: 'main', title: 'Page heading & introduction', fields: common.filter(field => field.name !== 'heroImageId').map(field => field.name) },
    { id: 'legacy', title: 'Saved photo fields (unused on Rooms)', fields: ['heroImageId'] },
    { id: 'room-details', title: 'Shared room-detail headings', fields: [...detail, ...related].map(field => field.name) },
  ];
  return <div className="max-w-5xl space-y-4">
    <WebsiteEditorHeader title={page.label} status={document.publication} live={`/${section}`} description={section==='rooms'?'Edit the public introduction and headings shared by room pages. Room photos, amenities and prices are managed with each room. The page photo fields are retained for compatibility. The public hero uses photos assigned to rooms.':page.description}>
      {section==='rooms' && <Link href="/admin/rooms" className={websiteShortcut}>Manage rooms and rates</Link>}
      {section==='experiences' && <><Link href="/admin/experiences?type=experience" className={websiteShortcut}>Manage experiences and dinner</Link><Link href="/admin/experiences?type=rental" className={websiteShortcut}>Manage rentals</Link></>}
      {section==='transfers' && <Link href="/admin/transfers" className={websiteShortcut}>Manage transfer listings</Link>}
      {section==='explore-koman' && <Link href="/admin/explore-koman" className={websiteShortcut}>Manage Explore Koman articles</Link>}
    </WebsiteEditorHeader>
    <SiteDocumentForm documentKey={section} fields={[...page.fields]} data={document.data} media={media} sections={section==='rooms'?roomSections:undefined} preview={section==='rooms'?'/rooms?preview=rooms':undefined}/>
  </div>;
}
