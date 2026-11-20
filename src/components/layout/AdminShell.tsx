'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AdminAppResume } from '@/components/admin/AdminAppResume';
import type { AdminRole } from '@/lib/admin/auth';

const AdminFrame = dynamic(() => import('./AdminFrame'));

export default function AdminShell({ children, role, account }: {
  children: React.ReactNode;
  role: AdminRole | null;
  account: { email: string; propertyId: string } | null;
}) {
  const pathname = usePathname();
  const standalonePage = pathname === '/admin/login' || pathname === '/admin/mfa' || pathname.startsWith('/admin/workspace');

  return <>
    <AdminAppResume/>
    <link rel="manifest" href="/admin/manifest.webmanifest"/>
    <link rel="apple-touch-icon" sizes="180x180" href="/admin/apple-touch-icon.png"/>
    <meta name="apple-mobile-web-app-title" content="Borealis Admin"/>
    {standalonePage ? children : <AdminFrame role={role} account={account}>{children}</AdminFrame>}
  </>;
}
