import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { SiteDocumentForm } from '@/components/admin/SiteDocumentForm';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const fields = [
  { name: 'eyebrow', label: 'Booking page eyebrow' },
  { name: 'heading', label: 'Booking page heading' },
  { name: 'description', label: 'Booking page introduction', kind: 'textarea' as const },
];

export default async function BookingContentPage() {
  const session = await requireAdmin(['owner', 'manager', 'editor']);
  const document = await adminSiteContentRepository.document(session, 'book').catch(() => null);
  if (!document) return <AdminEmptyState title="CMS database update required" description="Apply migration 20260911_037_public_admin_content_sync.sql, then reload." />;
  return <div className="space-y-8">
    <AdminPageHeader title="Booking page content" description="Edit only the introduction above the booking flow. Availability, pricing, steps and form labels remain protected booking functionality." actions={<Link href="/book" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Preview Website</Link>} />
    <SiteDocumentForm documentKey="book" fields={fields} data={document.data} />
  </div>;
}
