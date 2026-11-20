import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { AdminPageHeader } from '@/components/admin/ui';
import { WebsiteStatusLabel } from '@/components/admin/WebsiteStatusLabel';
import type { WebsiteStatus } from '@/lib/admin/website-status';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const pages = [
  ['Homepage', 'homepage', 'Main photo, headline and featured sections'],
  ['Rooms', 'rooms', 'Public introduction and shared room headings'],
  ['Experiences', 'experiences', 'Public page copy and shared headings'],
  ['Transfers', 'transfers', 'Public page copy and transfer process'],
  ['Explore Koman', 'explore-koman', 'Guide landing page'],
  ['About', 'about'],
  ['Gallery', 'gallery'],
  ['Contact', 'contact', 'Contact and directions copy'],
  ['Booking page', 'book'],
] as const;

const shared = [
  ['Header menu', 'navigation'],
  ['Footer', 'footer'],
  ['Shared buttons and messages', 'global'],
] as const;

const tools = [
  ['Photos', '/admin/media', ['owner', 'manager', 'editor']],
  ['Languages', '/admin/languages', ['owner', 'manager', 'editor']],
  ['Search appearance', '/admin/seo', ['owner', 'manager', 'editor']],
  ['Explore Koman articles', '/admin/explore-koman', ['owner']],
] as const;

const rowLink = 'grid min-h-[3.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5';

export default async function ContentPage() {
  const session = await requireAdmin();
  const statuses = await adminSiteContentRepository.statuses(session).catch(() => null);
  const visibleTools = tools.filter(([, , roles]) => roles.some(role => role === session.role));
  const pending = [...pages, ...shared].filter(([, key]) => statuses?.[key] === 'Unpublished changes' || statuses?.[key] === 'Draft only');
  return <div className="max-w-4xl space-y-6">
    <AdminPageHeader title="Website" actions={<a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-brand">View live website ↗</a>} />
    {pending.length > 0 && <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60">
      <h2 className="px-4 pt-3 text-base font-bold text-lake">Unpublished changes</h2>
      <ul className="divide-y divide-amber-100">{pending.map(([label, key]) => <li key={key}><AdminNavLink className={rowLink} href={'/admin/content/' + key}><span className="font-semibold text-lake">{label}</span><span className="text-sm font-semibold text-brand">Review <span aria-hidden="true">→</span></span></AdminNavLink></li>)}</ul>
    </section>}
    <PageRows title="Pages" entries={pages} statuses={statuses}/>
    <PageRows title="Site-wide content" entries={shared} statuses={statuses}/>
    {visibleTools.length > 0 && <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h2 className="border-b border-stone-200 px-4 py-3 text-base font-bold text-lake">Website tools</h2>
      <ul className="divide-y divide-stone-100">{visibleTools.map(([label, href]) => <li key={href}><AdminNavLink href={href} className={rowLink}><span className="font-semibold text-lake">{label}</span><span aria-hidden="true" className="text-brand">→</span></AdminNavLink></li>)}</ul>
    </section>}
  </div>;
}

function PageRows({ title, entries, statuses }: { title: string; entries: readonly (readonly [string, string, string?])[]; statuses: Record<string, WebsiteStatus> | null }) {
  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
    <h2 className="border-b border-stone-200 px-4 py-3 text-base font-bold text-lake">{title}</h2>
    <ul className="divide-y divide-stone-100">{entries.map(([label, key, description]) => <li key={key}>
      <AdminNavLink href={'/admin/content/' + key} className={rowLink + ' sm:grid-cols-[minmax(0,1fr)_11rem_2.75rem]'}>
        <span className="min-w-0 self-center text-sm font-semibold text-lake">{label}{description && <span className="mt-0.5 hidden font-normal text-slate-600 sm:block">{description}</span>}</span>
        <span className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"><WebsiteStatusLabel status={statuses?.[key] ?? 'Status unavailable'}/></span>
        <span className="col-start-2 row-span-2 row-start-1 text-sm font-semibold text-brand sm:col-start-3 sm:row-span-1">Edit <span aria-hidden="true">→</span></span>
      </AdminNavLink>
    </li>)}</ul>
  </section>;
}
