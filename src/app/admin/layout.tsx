'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { SlugChangeGuard } from '@/components/admin/SlugChangeGuard';
import { TranslationShortcut } from '@/components/admin/TranslationShortcut';
import { AdminFormValueGuard } from '@/components/admin/AdminFormValueGuard';
import { AdminWorkspaceNav } from '@/components/admin/AdminWorkspaceNav';
import { AdminMobileInputEnhancer } from '@/components/admin/AdminMobileInputEnhancer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <div data-admin-shell className="flex min-h-screen"><SlugChangeGuard/><TranslationShortcut/><AdminFormValueGuard/><AdminMobileInputEnhancer/>
      <a href="#admin-main" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white focus:translate-y-0">Skip to admin content</a>
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block"><AdminSidebar /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main id="admin-main" className="flex-1 overflow-x-hidden" tabIndex={-1}>
          <div className="admin-content mx-auto w-full max-w-[90rem] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-12"><AdminWorkspaceNav />{children}</div>
        </main>
      </div>
    </div>
  );
}
