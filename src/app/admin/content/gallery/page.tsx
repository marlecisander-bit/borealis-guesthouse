import Link from 'next/link';
import {AdminPageHeader} from '@/components/admin/ui';
import {SiteDocumentForm} from '@/components/admin/SiteDocumentForm';
import {requireAdmin} from '@/lib/admin/auth';
import {adminMediaRepository} from '@/lib/repositories/admin/media';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

const fields=[
  {name:'eyebrow',label:'Eyebrow'},
  {name:'heading',label:'Heading'},
  {name:'description',label:'Description',kind:'textarea' as const},
  {name:'heroImageId',label:'Hero image',kind:'image' as const,help:'Select or upload an image from the central Media Library.'},
  {name:'heroImageAlt',label:'Hero image alternative text'},
  {name:'introEyebrow',label:'Introduction eyebrow'},
  {name:'introHeading',label:'Introduction heading'},
  {name:'introDescription',label:'Introduction description',kind:'textarea' as const},
];

export default async function GalleryContentPage(){
  const session=await requireAdmin(['owner','manager','editor']);
  const[document,assets]=await Promise.all([adminSiteContentRepository.document(session,'gallery'),adminMediaRepository.options(session).catch(()=>[])]);
  const media=assets.filter(asset=>asset.status!=='archived').map(asset=>({id:asset.id,label:asset.title||asset.alt_text||asset.filename||'Untitled image',imageUrl:asset.publicUrl}));
  return <div className="space-y-8">
    <AdminPageHeader title="Gallery content" description="Edit the Gallery page presentation. The public gallery itself continues to use published Media Library items." actions={<div className="flex flex-wrap gap-3"><Link href="/admin/media" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Manage gallery images</Link><Link href="/gallery" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Preview Website</Link></div>}/>
    <SiteDocumentForm documentKey="gallery" fields={fields} data={document.data} media={media}/>
  </div>;
}
