import { getCurrentAdmin } from '@/lib/admin/auth';
import AdminShell from '@/components/layout/AdminShell';
import './admin-workspace.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentAdmin();
  return <AdminShell role={session?.role ?? null} account={session ? { email: session.email, propertyId: session.propertyId } : null}>{children}</AdminShell>;
}
