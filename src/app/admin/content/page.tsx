import Link from 'next/link';
import { AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const publicPages=[
  ['Homepage','homepage'],['Rooms page','rooms'],['Experiences page','experiences'],['Transfers page','transfers'],
  ['Explore Koman introduction','explore-koman'],['Gallery','gallery'],['Contact','contact'],['Booking page','book'],
] as const;
const sharedAreas=[['Shared sections','global'],['Footer','footer'],['Navigation','navigation']] as const;
const websiteTools=[['Explore Koman articles','/admin/explore-koman'],['Media','/admin/media'],['Search appearance','/admin/seo']] as const;

export default async function ContentPage() {
  const session=await requireAdmin();
  const statuses=await adminSiteContentRepository.statuses(session).catch(()=>null);
  return <div className="max-w-4xl space-y-5">
    <AdminPageHeader title="Website"/>
    <nav aria-label="Website tools" className="flex flex-wrap gap-2">{websiteTools.map(([label,href])=><Link href={href} key={href} className="inline-flex min-h-11 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-brand">{label}</Link>)}</nav>
    {!statuses&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Page statuses could not be loaded. <Link href="/admin/content" className="underline">Reload Website</Link></p>}
    <PageRows title="Public pages" pages={publicPages} statuses={statuses}/>
    <PageRows title="Shared content" pages={sharedAreas} statuses={statuses}/>
  </div>;
}
function PageRows({title,pages,statuses}:{title:string;pages:readonly (readonly [string,string])[];statuses:Record<string,string>|null}) {
  return <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-bold text-lake">{title}</h2>
    <ul className="divide-y divide-stone-100">{pages.map(([label,slug])=><li key={slug} className="flex min-h-14 items-center justify-between gap-3 px-4 py-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"><span className="text-sm font-semibold text-lake">{label}</span>{statuses?.[slug]&&<StatusBadge status={statuses[slug]}/>}</div>
      <Link href={'/admin/content/'+slug} aria-label={'Edit '+label} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-sm font-bold text-brand underline">Edit</Link>
    </li>)}</ul>
  </section>;
}
