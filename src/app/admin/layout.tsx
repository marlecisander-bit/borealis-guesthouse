'use client';

import {Suspense} from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav';
import './admin-workspace.css';
import AdminHeader from '@/components/layout/AdminHeader';
import { SlugChangeGuard } from '@/components/admin/SlugChangeGuard';
import { AdminFormValueGuard } from '@/components/admin/AdminFormValueGuard';
import { AdminWorkspaceNav } from '@/components/admin/AdminWorkspaceNav';
import { AdminMobileInputEnhancer } from '@/components/admin/AdminMobileInputEnhancer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const installMetadata=<><link rel="manifest" href="/admin/manifest.webmanifest"/><link rel="apple-touch-icon" sizes="180x180" href="/admin/apple-touch-icon.png"/><meta name="apple-mobile-web-app-title" content="Borealis Admin"/></>;
  if (pathname === '/admin/login' || pathname === '/admin/mfa' || pathname.startsWith('/admin/workspace')) return <>{installMetadata}{children}</>;

  return (
    <div data-admin-shell className="flex min-h-screen">{installMetadata}<SlugChangeGuard/><AdminFormValueGuard/><AdminMobileInputEnhancer/>
      <a href="#admin-main" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white focus:translate-y-0">Skip to admin content</a>
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block"><AdminSidebar /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main id="admin-main" className="min-w-0 flex-1" tabIndex={-1}>
          <div className="admin-content mx-auto w-full max-w-[90rem] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-12"><Suspense><AdminWorkspaceNav /></Suspense>{children}</div>
        </main>
      </div>
      <AdminMobileNav/>
    </div>
  );
}
