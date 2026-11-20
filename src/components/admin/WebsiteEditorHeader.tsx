import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { AdminPageHeader } from './ui';
import { WebsiteStatusLabel } from './WebsiteStatusLabel';
import type { WebsiteStatus } from '@/lib/admin/website-status';

export const websiteShortcut = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-brand';

export function WebsiteEditorHeader({ title, status, live, children, description }: {
  title: string; status?: WebsiteStatus; live: string; children?: React.ReactNode; description?: string;
}) {
  return <div className="space-y-2">
    <AdminNavLink href="/admin/content" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">← Back to Website</AdminNavLink>
    <AdminPageHeader title={title} description={description} actions={<a href={live} target="_blank" rel="noreferrer" className={websiteShortcut}>View live page ↗</a>}/>
    {status && <WebsiteStatusLabel status={status}/>}
    {children && <div className="website-shortcut-buttons">{children}</div>}
  </div>;
}
