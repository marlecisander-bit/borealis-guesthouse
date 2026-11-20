import Link from 'next/link';
import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { requireAdmin } from '@/lib/admin/auth';
import { adminWorkspacesFor } from '@/lib/admin/navigation';
import { AdminPageHeader } from '@/components/admin/ui';
import { AdminAccountActions } from '@/components/admin/AdminAccountActions';

export default async function MorePage() {
  const session=await requireAdmin();
  return <div className="max-w-3xl space-y-5">
    <AdminPageHeader title="More"/>
    <nav aria-label="Workspaces" className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {adminWorkspacesFor(session.role).map((item)=><AdminNavLink href={item.href} key={item.href} className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 hover:bg-ivory">
        <span><strong className="block text-lake">{item.label}</strong><span className="block text-sm text-slate-600">{item.description}</span></span><span aria-hidden="true" className="text-brand">→</span>
      </AdminNavLink>)}
    </nav>
    <section aria-label="Account" className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-bold text-lake">Account</h2><p className="break-all text-sm text-slate-600">{session.email}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2"><Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-3 text-sm font-bold text-brand">View public website ↗</Link><AdminAccountActions/></div>
    </section>
  </div>;
}
