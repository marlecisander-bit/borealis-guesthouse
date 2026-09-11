import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { SiteDocumentForm } from '@/components/admin/SiteDocumentForm';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const fields = [
  { name: 'headerCtaLabel', label: 'Desktop header booking label' },
  { name: 'mobileMenuCtaLabel', label: 'Mobile menu booking label' },
  { name: 'mobileBarCtaLabel', label: 'Mobile sticky booking label' },
  { name: 'sharedCtaEyebrow', label: 'Shared booking section eyebrow' },
  { name: 'sharedCtaHeading', label: 'Shared booking section heading' },
  { name: 'sharedCtaLabel', label: 'Shared booking button label' },
  { name: 'sharedCtaTarget', label: 'Shared booking button destination', help: 'Use a safe internal path such as /book.' },
];

export default async function GlobalContentPage() {
  const session = await requireAdmin(['owner', 'manager', 'editor']);
  const document = await adminSiteContentRepository.document(session, 'global').catch(() => null);
  if (!document) return <AdminEmptyState title="CMS database update required" description="Apply migration 20260911_037_public_admin_content_sync.sql, then reload." />;
  return <div className="space-y-8">
    <AdminPageHeader title="Global public sections" description="Edit booking labels and the shared call-to-action used across public pages." actions={<Link href="/" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Preview Website</Link>} />
    <SiteDocumentForm documentKey="global" fields={fields} data={document.data} />
  </div>;
}
