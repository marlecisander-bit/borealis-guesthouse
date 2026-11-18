import Link from 'next/link';
import {WebsiteEditorHeader,websiteShortcut} from '@/components/admin/WebsiteEditorHeader';
import {SiteDocumentForm} from '@/components/admin/SiteDocumentForm';
import {requireAdmin} from '@/lib/admin/auth';
import {adminMediaRepository} from '@/lib/repositories/admin/media';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

const fields=[
  {name:'eyebrow',label:'Eyebrow'},
  {name:'heading',label:'Heading'},
  {name:'description',label:'Description',kind:'textarea' as const},
  {name:'heroImageId',label:'Hero images',kind:'hero' as const,help:'Select or upload an image from the central Media Library.'},
  {name:'introEyebrow',label:'Introduction eyebrow'},
  {name:'introHeading',label:'Introduction heading'},
  {name:'introDescription',label:'Introduction description',kind:'textarea' as const},
];

export default async function GalleryContentPage(){
  const session=await requireAdmin(['owner','manager','editor']);
  const[document,assets]=await Promise.all([adminSiteContentRepository.document(session,'gallery'),adminMediaRepository.options(session).catch(()=>[])]);
  const media=assets.filter(asset=>asset.status!=='archived').map(asset=>({id:asset.id,label:asset.title||asset.alt_text||asset.filename||'Untitled image',imageUrl:asset.publicUrl}));
  return <div className="max-w-5xl space-y-4">
    <WebsiteEditorHeader title="Gallery" status={document.publication} live="/gallery" description="Edit the Gallery page copy. The photo grid uses existing gallery entries and their published media.">
      <Link href="/admin/media" className={websiteShortcut}>Open media library</Link>
    </WebsiteEditorHeader>
    <SiteDocumentForm documentKey="gallery" fields={fields} data={document.data} media={media} preview="/gallery?preview=gallery" sections={[
      {id:'main',title:'Gallery introduction',fields:['eyebrow','description']},
      {id:'legacy',title:'Saved photo & headings (unused on Gallery)',fields:fields.filter(field=>field.name!=='eyebrow'&&field.name!=='description').map(field=>field.name)},
    ]}/>
  </div>;
}
