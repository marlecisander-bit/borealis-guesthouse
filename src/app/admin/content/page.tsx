import {AdminButton,AdminPageHeader,StatusBadge} from '@/components/admin/ui';
import {requireAdmin} from '@/lib/admin/auth';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';

const sections=[
  ['Homepage','homepage','Edit the homepage sections, imagery and calls to action.'],
  ['Rooms','rooms','Edit the Rooms landing-page hero and introduction.'],
  ['Experiences','experiences','Edit the Experiences landing-page presentation.'],
  ['Transfers','transfers','Edit the Transfers landing-page presentation.'],
  ['Explore Koman','explore-koman','Edit the guide landing-page hero and introduction.'],
  ['About','about','Edit the property story and location content.'],
  ['Gallery','gallery','Manage the public image collection.'],
  ['Contact','contact','Edit contact details and visible page content.'],
  ['Footer','footer','Edit global footer content.'],
  ['Navigation','navigation','Edit public navigation labels and destinations.'],
] as const;

export default async function ContentPage(){
  const session=await requireAdmin();
  const statuses=await adminSiteContentRepository.statuses(session).catch(()=>({} as Record<string,'draft'|'published'|'archived'>));
  return <div className="space-y-8">
    <AdminPageHeader title="Website content" description="Edit the words and imagery used by the public website without changing its protected layout."/>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{sections.map(([label,slug,description])=><article key={slug} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold text-slate-950">{label}</h2><StatusBadge status={statuses[slug]||'draft'}/></div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{description}</p><div className="mt-6"><AdminButton href={`/admin/content/${slug}`} variant="secondary">Edit content</AdminButton></div></article>)}</div>
  </div>;
}
