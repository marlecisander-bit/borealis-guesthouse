import { AdminButton, AdminPageHeader, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const publicPages = [
  ['Homepage', 'homepage', 'Homepage sections, imagery and calls to action.'],
  ['Rooms page', 'rooms', 'Introduction shown above the room collection.'],
  ['Experiences page', 'experiences', 'Introduction to guest activities and local journeys.'],
  ['Transfers page', 'transfers', 'Introduction to guest transfer services.'],
  ['Explore Koman', 'explore-koman', 'The destination guide introduction.'],
  ['About', 'about', 'The Borealis story and location content.'],
  ['Gallery', 'gallery', 'The public image collection and its introduction.'],
  ['Contact', 'contact', 'The contact-page introduction. Property details stay in Settings.'],
  ['Booking page', 'book', 'The welcome content shown above the booking flow.'],
] as const;

const sharedAreas = [
  ['Shared sections', 'global', 'Calls to action and labels reused across public pages.'],
  ['Footer', 'footer', 'Footer description and supporting links.'],
  ['Navigation', 'navigation', 'Public menu labels and destinations.'],
] as const;

export default async function ContentPage() {
  const session = await requireAdmin();
  const statuses = await adminSiteContentRepository.statuses(session).catch(() => ({} as Record<string, 'draft' | 'published' | 'archived'>));

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Website" description="Choose a public page, update its words and images, then preview before publishing."/>
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Public pages</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {publicPages.map(([label, slug, description]) => (
            <article key={slug} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold text-slate-950">{label}</h3><StatusBadge status={statuses[slug] || 'draft'}/></div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-6"><AdminButton href={`/admin/content/${slug}`} variant="secondary">Edit page</AdminButton></div>
            </article>
          ))}
        </div>
      </section>
      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-bold sm:px-6">More website settings <span aria-hidden="true" className="text-slate-400">⌄</span></summary>
        <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
          {sharedAreas.map(([label, slug, description]) => (
            <article key={slug} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{label}</h3><StatusBadge status={statuses[slug] || 'draft'}/></div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-4"><AdminButton href={`/admin/content/${slug}`} variant="secondary">Edit</AdminButton></div>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
