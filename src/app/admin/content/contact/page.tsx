import Link from 'next/link';
import {AdminEmptyState} from '@/components/admin/ui';
import {WebsiteEditorHeader,websiteShortcut} from '@/components/admin/WebsiteEditorHeader';
import {SiteDocumentForm} from '@/components/admin/SiteDocumentForm';
import {requireAdmin} from '@/lib/admin/auth';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

const fields=[
  {name:'eyebrow',label:'Hero eyebrow'},
  {name:'title',label:'Page title'},
  {name:'introduction',label:'Page introduction',kind:'textarea' as const},
  {name:'directHeading',label:'Direct contact heading'},
  {name:'directDescription',label:'Direct contact description',kind:'textarea' as const},
  {name:'addressLabel',label:'Address label'},
  {name:'directionsText',label:'Directions text',kind:'textarea' as const},
  {name:'journeyEyebrow',label:'Journey section eyebrow'},
  {name:'journeyHeading',label:'Journey section heading'},
  {name:'journeyDescription',label:'Journey section description',kind:'textarea' as const},
  {name:'primaryCtaLabel',label:'Primary CTA label'},
  {name:'primaryCtaTarget',label:'Primary CTA destination',help:'Use an internal path such as /transfers.'},
  {name:'secondaryCtaLabel',label:'Secondary CTA label'},
  {name:'secondaryCtaTarget',label:'Secondary CTA destination',help:'Use an internal path such as /book.'},
];

export default async function Page(){
  const session=await requireAdmin(['owner','manager','editor']);
  const document=await adminSiteContentRepository.document(session,'contact').catch(()=>null);
  return <div className="max-w-5xl space-y-4">
    <WebsiteEditorHeader title="Contact" status={document?.publication ?? 'Status unavailable'} live="/gallery#contact" description="Edit contact and directions copy. Phone, WhatsApp, email and address come from Property settings.">
      <Link href="/admin/settings#property-details" className={websiteShortcut}>Property settings</Link>
    </WebsiteEditorHeader>
    {document ? <SiteDocumentForm documentKey="contact" fields={fields} data={document.data} preview="/gallery?preview=contact#contact" sections={[
      {id:'main',title:'Contact introduction',fields:['eyebrow','introduction']},
      {id:'direct-contact',title:'Direct contact & address',fields:fields.slice(3,7).map(field=>field.name)},
      {id:'directions',title:'Directions & travel links',fields:fields.slice(7).map(field=>field.name)},
      {id:'legacy',title:'Saved title (unused on Contact)',fields:['title']},
    ]}/> : <AdminEmptyState title="Contact content could not be loaded" description="Reload this page before editing."/>}
  </div>;
}
