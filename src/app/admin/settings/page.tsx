import { SettingsForm } from '@/components/admin/SettingsForm';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
import { adminSettingsRepository } from '@/lib/repositories/admin/settings';
import { PropertyPublication } from '@/components/admin/PropertyPublication';

export default async function SettingsPage() {
  const session = await requireAdmin(['owner', 'manager']);
  const data = await adminSettingsRepository.get(session);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Borealis settings"
        description="Manage property details and operational defaults. Secret credentials remain server-environment configuration only."
      />
      <PropertyPublication published={data.propertyPublished} />
      <SettingsForm data={data} />
    </div>
  );
}
