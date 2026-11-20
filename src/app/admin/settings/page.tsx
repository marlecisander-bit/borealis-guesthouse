import Link from 'next/link';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSettingsRepository } from '@/lib/repositories/admin/settings';
import { PropertyPublication } from '@/components/admin/PropertyPublication';

const destinations=[
  ['Property details','#property-details'],['Booking policies','#booking-policies'],['Payments & fees','#payments-fees'],
  ['Notification preferences','#notification-preferences'],
  ['Notification inbox and devices','/admin/notifications'],['Team & Access','/admin/settings/team'],
] as const;

export default async function SettingsPage() {
  const session = await requireAdmin(['owner', 'manager']);
  const data = await adminSettingsRepository.get(session);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Settings"
        description="Manage property information, booking policies and owner notifications."
      />
      <nav aria-label="Settings destinations" className="grid overflow-hidden rounded-2xl border border-stone-200 bg-white sm:grid-cols-2">
        {destinations.filter(([,href])=>href!=='/admin/settings/team'||session.role==='owner').map(([label,href])=>{const Destination=href.startsWith('#')?'a':Link;return <Destination key={href} href={href} className="flex min-h-12 items-center justify-between gap-3 border-b border-stone-100 px-4 py-2 text-sm font-semibold text-brand hover:bg-ivory">{label}<span aria-hidden="true">→</span></Destination>})}
      </nav>
      <PropertyPublication published={data.propertyPublished} />
      <SettingsForm data={data} />
    </div>
  );
}
