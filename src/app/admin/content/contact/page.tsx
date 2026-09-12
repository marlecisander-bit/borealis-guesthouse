import Link from 'next/link';
import {AdminEmptyState,AdminPageHeader} from '@/components/admin/ui';
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
  if(!document)return <AdminEmptyState title="CMS database update required" description="Run database/migrations/20260902_007_site_content_cms.sql in Supabase, then reload."/>;
  return <div className="space-y-8">
    <AdminPageHeader title="Contact page" description="Edit page copy and calls to action. Phone, email, social links, address and Google Maps are managed once in Settings → Property." actions={<><Link href="/admin/settings" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Property contact details</Link><Link href="/contact" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Preview website</Link></>}/>
    <SiteDocumentForm documentKey="contact" fields={fields} data={document.data}/>
  </div>;
}
